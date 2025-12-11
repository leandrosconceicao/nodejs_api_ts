import { autoInjectable, inject } from "tsyringe";
import { IProductRepository } from "../../interfaces/IProductRepository";
import ICloudService from "../../interfaces/ICloudService";
import { IProduct, IProductImages, PRODUCT_SCHEMA_VALIDATION, PRODUCT_UPDATE_BACH, ProductBatchUpdate, ProductFilters } from "../../types/IProduct";
import { IProductHandler } from "../../interfaces/IProductHandler";
import { IFile } from "../../interfaces/IFile";
import { idValidation } from "../../../utils/defaultValidations";
import { z } from "zod";
import BadRequestError from "../../../models/errors/BadRequest";
import ICategoryRepository from "../../interfaces/ICategoryRepository";
import NotFoundError from "../../../models/errors/NotFound";

@autoInjectable()
export default class ProductHandler implements IProductHandler {

    constructor(
        @inject("IProductRepository") private readonly repository : IProductRepository,
        @inject("ICloudService") private readonly cloudService: ICloudService,
        @inject("ICategoryRepository") private readonly catRepository : ICategoryRepository
    ) {}   
    
    
    deleteProduct = async (storeCode: string, id: string): Promise<void> => {
        
        this.validateIdQuery(storeCode, id);
        
        const product = await this.findByCompanyFilter(storeCode, id);
        
        this.deleteImages(storeCode, id, product.images);
        
        await this.repository.delete(product._id.toString());
    }
    
    private validateIdQuery(storeCode: string, id: string) {
        idValidation.parse(storeCode);
        idValidation.parse(id);
    }
    
    async createProduct(body: any): Promise<IProduct> {
        const data = PRODUCT_SCHEMA_VALIDATION
        .transform((value) => {
            return value as IProduct;
        })    
        .parse(body);
        
        const images = data.images;
        
        delete data.images;
        
        const newProduct = await this.repository.add(data);
        
        await this.uploadImages(newProduct.storeCode.toString(), newProduct._id.toString(), images as IProductImages[]);
        
        return newProduct;
    }
    
    async deleteProductImage(storeCode: string, productId: string, file: { filename: string; link: string; }): Promise<void> {
        
        this.validateIdQuery(storeCode, productId);

        z.object({
            filename: z.string().nonempty(),
            link: z.string().nonempty(),
        }).parse(file)
        
        await this.repository.removeImage(storeCode, productId, file),

        this.cloudService.deleteBucketFile(`${storeCode}/products/${productId}/${file.filename}`)

    }

    async addProductImage(storeCode: string, productId: string, file: IFile): Promise<string> {
        
        this.validateIdQuery(storeCode, productId);

        if (!file) {
            throw new BadRequestError("Arquivo não foi enviado")
        }

        const product = await this.findByCompanyFilter(storeCode, productId);

        const base64String = file.buffer.toString('base64');

        z.string().base64(base64String).nonempty();
        
        const link = await this.uploadFile(product.storeCode.toString(), product._id.toString(), file.originalname, base64String);

        await this.repository.addImage(storeCode, productId, {
            filename: file.originalname,
            link: link
        });

        return link;
    }

    findByCompanyFilter(storeCode: string, id: string): Promise<IProduct> {
        return this.repository.findByCompanyFilter(storeCode, id);
    }
    
    findAll(query: ProductFilters): Promise<IProduct[]> {
        return this.repository.findAll(query);
    }

    findOne(id: string): Promise<IProduct> {
        return this.repository.findOne(id);
    }

    private async uploadFile(storeCode: string, productId: string, filename: string, base64String: string) {
        return await this.cloudService.uploadFile({
            path: `${storeCode}/products/${productId}/${filename}`,
            data: base64String
        });
    }
    
    private async uploadImages(storeCode: string, productId: string, images: IProductImages[]) {
        if (images?.length) {
            for (let image = 0; image < images.length; image++) {
                let element = images[image];
                try {
                
                    const link = await this.uploadFile(storeCode, productId, element.filename, element.base64)
                    
                    element.link = link;    

                    await this.repository.addImage(storeCode, productId, {
                        filename: element.filename,
                        link: link,
                        thumbnail: element.thumbnail
                    });
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    private async deleteImages(storeCode: string, productId: string, images: IProductImages[]) {
        if (images?.length) {
            for (let image = 0; image < images.length; image++) {
                let element = images[image];
                try {
                
                    await this.cloudService.deleteBucketFile(`${storeCode}/products/${productId}/${element.filename}`);
                    
                } catch (e) {
                    console.log(e);
                }
            }
        }
    }

    setThumbnail = async (storeCode: string, productId: string, image: IProductImages): Promise<void> => {
        
        this.validateIdQuery(storeCode, productId);
        
        z.object({
            filename: z.string().min(1),
            link: z.string().url(),
            thumbnail: z.boolean().default(false).optional()
        }).parse(image);

        await this.repository.setProductThumbnail(storeCode, productId, image);
    }

    batchUpdate = async (products: any): Promise<void> => {
        
        const body = PRODUCT_UPDATE_BACH
            .transform((value) => value as ProductBatchUpdate[])
            .parse(products);

        for (let prod of body) {
            const product = await this.findOne(prod.id);

            if (prod.category) {
                const category = await this.catRepository.findOne(prod.category);
                if (!category) {
                    throw new NotFoundError("Categoria não localizada")
                }
            }

            await this.repository.update(product._id.toString(), {
                isActive: prod.isActive,
                preco: prod.preco,
                category: prod.category,
                descricao: prod.descricao,
                produto: prod.produto,
                preparacao: prod.preparacao
            })
        }
    }
}
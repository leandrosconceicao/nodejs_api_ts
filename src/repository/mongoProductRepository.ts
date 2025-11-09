import { delay, injectable, registry } from "tsyringe";
import { IProductRepository } from "../domain/interfaces/IProductRepository";
import { ProductFilters, IProduct, IProductAddOne, IProductImages } from "../domain/types/IProduct";
import NotFoundError from "../models/errors/NotFound";
import { AddOnes } from "../models/products/AddOnes";
import { Products } from "../models/products/Products";
import BadRequestError from "../models/errors/BadRequest";
import { IOrderProduct } from "../models/Orders";
import mongoose from "mongoose";
import { Category } from "../models/Categories";

var ObjectId = mongoose.Types.ObjectId;

@injectable()
@registry([
    {
        token: `IProductRepository`,
        useToken: delay(() => MongoProductRepository)
    }
])
export class MongoProductRepository implements IProductRepository {    

    removeImage = async (storeCode: string, productId: string, file: { filename: string; link: string; }): Promise<IProduct> => {
        await this.findByCompanyFilter(storeCode, productId);

        const update = await Products.findByIdAndUpdate(new ObjectId(productId), {
            $pull: {
                images: file
            }
        }, {
            new: true
        })
        
        return update;
    }

    async addImage(storeCode: string, productId: string, file: { filename: string; link: string; }): Promise<IProduct> {
        await this.findByCompanyFilter(storeCode, productId);

        const update = await Products.findByIdAndUpdate(new ObjectId(productId), {
            $push: {
                images: file
            }
        }, {
            new: true
        })

        return update;
    }    

    findByCompanyFilter = async (storeCode: string, id: string): Promise<IProduct> => {
        const product = await Products.findOne({
            _id: new ObjectId(id),
            storeCode: new ObjectId(storeCode)
        })

        if (!product) {
            throw new NotFoundError("Produto não localizado")
        }

        return product;
    }

    update = async (id: string, data: Partial<IProduct>): Promise<IProduct> => {

        await this.findOne(id);

        return Products.findByIdAndUpdate(id, data, {new: true});
    }

    async delete(id: string): Promise<void> {

        const data = await this.findOne(id);

        await Products.deleteOne(data._id);
    }

    add = async (data: IProduct): Promise<IProduct> => {
        const category = await Category.findById(`${data.category}`);
        
        if (!category)
            throw new NotFoundError("Categoria informada não foi localizada");

        const product = await Products.create(data);

        product.images = data.images;

        return product;
    }   

    findAll(query: ProductFilters): Promise<IProduct[]> {
        return Products.find(query).populate('category')
    }

    async findOne(id: string): Promise<IProduct> {
        const product = await this.getById(id);

        if (!product)
            throw new NotFoundError('Produto não localizado');

        if (product.addOnes) {
            for (let i = 0; i < product.addOnes.length; i++) {
                let item = product.addOnes[i];
                const addOne = await AddOnes.findById<IProductAddOne>(item._id)
                if (addOne) {
                    item.name = addOne.name;
                    item.type = addOne.type;
                    item.maxQtdAllowed = addOne.maxQtdAllowed;
                    item.items = addOne.items;
                }
            }
        }
        return product;
    }

    getById(id: string) : Promise<IProduct> {
        return Products.findById(id).populate('category');
    }
    
    async validateProducts(storeCode: string, products: IOrderProduct[]): Promise<void> {
        for (let i = 0; i < products.length; i++) {
            const prod = products[i];

            const fetchProduct = await Products.findOne({
                storeCode: new ObjectId(storeCode),
                _id: new ObjectId(prod.productId.toString())
            });

            if (!fetchProduct || !fetchProduct.isActive) 
                throw new BadRequestError(`Produto (${prod.productName}) não está disponível`)
        }
    }

    setProductThumbnail = async (storeCode: string, productId: string, file: IProductImages): Promise<IProduct> => {
        
        const product = await this.findByCompanyFilter(storeCode, productId);

        const imageIndex = product.images.findIndex(img => img.filename === file.filename && img.link === file.link);

        if (imageIndex === -1) {
            throw new NotFoundError('Image not found');
        }

        await Products.findByIdAndUpdate(new ObjectId(productId), {
            $set: {
                "images.$[].thumbnail": false
            }
        })

        const update = await Products.findByIdAndUpdate(
            new ObjectId(productId),
            {
                $set: {
                    [`images.${imageIndex}.thumbnail`]: file.thumbnail
                }
            },
            {
                new: true
            }
        );

        return update;
        
    }
}
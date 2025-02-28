import { delay, inject, injectable, registry } from "tsyringe";
import { IProductRepository } from "../domain/interfaces/IProductRepository";
import { ProductFilters, IProduct, IProductAddOne } from "../domain/types/IProduct";
import NotFoundError from "../models/errors/NotFound";
import { AddOnes } from "../models/products/AddOnes";
import { Products } from "../models/products/Products";
import ICloudService from "../domain/interfaces/ICloudService";
import ICategoryRepository from "../domain/interfaces/ICategoryRepository";

@injectable()
@registry([
    {
        token: `IProductRepository`,
        useToken: delay(() => MongoProductRepository)
    }
])
export class MongoProductRepository implements IProductRepository {

    constructor(
        @inject('ICategoryRepository') private readonly categoryRepository: ICategoryRepository,
        @inject('ICloudService') private readonly cloudService : ICloudService
    ) {}

    update = async (id: string, data: Partial<IProduct>): Promise<IProduct> => {

        const prod = await this.findOne(id);

        if (data.dataImage) {
            const link = await this.cloudService.uploadFile({
                path: `assets/${prod.storeCode}/${data.dataImage.path}`,
                data: data.dataImage.data
            })

            if (link) 
                data.image = link
        }

        return Products.findByIdAndUpdate(id, data, {new: true});
    }

    async delete(id: string): Promise<void> {

        const data = await this.findOne(id);

        Products.findByIdAndDelete(data._id);
    }

    add = async (data: IProduct): Promise<IProduct> => {
        const category = await this.categoryRepository.findOne(`${data.category}`);
        
        if (!category)
            throw new NotFoundError("Categoria informada não foi localizada");

        return Products.create(data);
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
        return Products.findById(id);
    }

}
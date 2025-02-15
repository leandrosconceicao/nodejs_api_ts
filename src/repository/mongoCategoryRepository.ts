import { Category, ICategory } from "../models/Categories";
import mongoose from "mongoose";
import ICategoryRepository from "../domain/interfaces/ICategoryRepository";
import { RegexBuilder } from "../utils/regexBuilder";
import { Products } from "../models/products/Products";
import BadRequestError from "../models/errors/BadRequest";
import NotFoundError from "../models/errors/NotFound";
import ICloudService from "../domain/interfaces/ICloudService";
import { delay, inject, injectable, registry } from "tsyringe";


var ObjectId = mongoose.Types.ObjectId;

@injectable()
@registry([
    {
        token: `ICategoryRepository`,
        useToken: delay(() => MongoCategoryRepository)
    }
])
export default class MongoCategoryRepository implements ICategoryRepository {

    constructor(@inject("ICloudService") private readonly cloudService: ICloudService) {}

    updateOrdenation(storeCode: string, data: Array<{ id: string; ordenacao: number; }>): Promise<any> {
        
        return Promise.all(
            data.map((val) => Category.updateOne({
                storeCode: new ObjectId(storeCode),
                _id: val.id,
            }, {
                ordenacao: val.ordenacao
            }))
        );
    }

    async update(id: string, data: Partial<{ nome: string; image: string; }>): Promise<ICategory> {
        
        const category = await this.getCategoryData(id);

        if (data.image) {
            data.image = await this.cloudService.uploadFile({
                data: data.image,
                path: `assets/${category.storeCode}/logo_${category._id}`
            })
        }

        return Category.findByIdAndUpdate(id, data);
    }

    
    async deleteOne(id: string): Promise<ICategory> {
        
        await this.getCategoryData(id);

        await this.checkProducts(id);


        return Category.findOneAndDelete({
            _id: new ObjectId(id)
        })
    }
    add(category: ICategory): Promise<ICategory> {
        return new Category(category).save();
    }

    findOne(id: string): Promise<ICategory> {
        return Category.findById(id);
    }

    findAll(storeCode: string, id?: string, nome?: string): Promise<Array<ICategory>> {
        const query: Partial<{
            storeCode: any,
            _id: any,
            nome: any
        }> = {
            storeCode: new ObjectId(storeCode)
        }
        if (id) {
            query._id = new ObjectId(id)
        }
        if (nome) {
            query.nome = RegexBuilder.searchByName(nome)
        }
        return Category.find(query)
    }

    private async checkProducts(categoryId: string) {
        const products = await Products.find({
            category: new ObjectId(categoryId),
        })
        if (products.length) {
            throw new BadRequestError("Categoria não pode ser excluida se possuir produtos cadastrados")
        }
    }

    private async getCategoryData(id: string) {

        const category = await this.findOne(id);

        if (!category) {
            throw new NotFoundError("Categoria não localizada");
        }

        return category;
    }

}
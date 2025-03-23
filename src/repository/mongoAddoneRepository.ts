import mongoose from "mongoose";
import { IAddonesRepository } from "../domain/interfaces/IAddonesRepository";
import { IProductAddOne } from "../domain/types/IProduct";
import NotFoundError from "../models/errors/NotFound";
import { AddOnes } from "../models/products/AddOnes";
import { injectable, registry, delay } from "tsyringe";
import { MongoAppRepository } from "./mongoAppRepository";

var ObjectId = mongoose.Types.ObjectId;

@injectable()
@registry([
    {
        token: `IAddonesRepository`,
        useToken: delay(() => MongoAddonesRepository)
    }
])
export class MongoAddonesRepository implements IAddonesRepository {

    async patch(id: string, movement: "pull" | "push", item: { name?: string; price?: number; }): Promise<void> {

        const addone = await this.findOne(id);

        let update = movement === "push" ? {
            $push: { items: item }
        } : {
            $pull: { items: item }
        }

        await AddOnes.updateOne({ _id: addone._id }, update)
    }

    findAll(storeCode: string): Promise<IProductAddOne[]> {
        return AddOnes.find({
            storeCode: new ObjectId(storeCode)
        })
    }

    async findOne(id: string): Promise<IProductAddOne> {
        const addOne = await AddOnes.findById(id);

        if (!addOne)
            throw new NotFoundError("Adicional não localizado")

        return addOne;
    }

    add(data: IProductAddOne): Promise<IProductAddOne> {
        return AddOnes.create(data);
    }

    async update(id: string, data: object): Promise<IProductAddOne> {
        const add = await this.findOne(id);

        return AddOnes.findByIdAndUpdate(add._id, data);
    }

    async delete(id: string): Promise<void> {

        const addone = await this.findOne(id);

        await AddOnes.findByIdAndDelete(addone._id);
    }
}
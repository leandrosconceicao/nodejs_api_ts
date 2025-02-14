import mongoose from 'mongoose';
import { IProduct } from './products/Products';

interface ICategory {
    nome: string,
    storeCode: mongoose.Types.ObjectId,
    createDate?: string,
    createdAt?: string,
    ordenacao: number,
    image?: string,
    products?: Array<IProduct>
}


const categorieSchema = new mongoose.Schema({
    // _id: {type: Number},
    nome: {type: String, required: [true, "Parametro (nome) é obrigatório"], unique: true},
    storeCode: {type: mongoose.Types.ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"]},
    ordenacao: {type: Number, required: [true, "Parametro (ordenacao) é obrigatório"]},
    createDate: {type: Date, default: () => { return new Date() }},
    image: {type: String}
}, {
    timestamps: true
});

categorieSchema.virtual("products")

categorieSchema.set("toJSON", {virtuals: true});
categorieSchema.set("toObject", {virtuals: true});

const Category = mongoose.model<ICategory>('categories', categorieSchema)

export {Category, ICategory};

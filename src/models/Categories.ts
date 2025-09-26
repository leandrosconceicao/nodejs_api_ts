import mongoose from 'mongoose';
import { z } from 'zod';
import { idValidation } from '../utils/defaultValidations';
import { IProduct } from '../domain/types/IProduct';

interface ICategory {
    _id?: mongoose.Types.ObjectId,
    nome: string,
    storeCode: mongoose.Types.ObjectId,
    createDate?: string,
    createdAt?: string,
    ordenacao: number,
    image?: string,
    products?: Array<IProduct>
}

const categorySchemaValidation = z.object({
    nome: z.string().min(1),
    storeCode: idValidation,
    image: z.string().optional(),
});


const categorieSchema = new mongoose.Schema({
    nome: {type: String, required: [true, "Parametro (nome) é obrigatório"]},
    storeCode: {type: mongoose.Types.ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"]},
    ordenacao: {type: Number},
    createDate: {type: Date, default: () => { return new Date() }},
    image: {type: String}
}, {
    timestamps: true
});

categorieSchema.pre("save", async function() {
    try {
        const categories = await Category.find({storeCode: this.storeCode})
        this.ordenacao = (categories.splice(-1)[0]?.ordenacao ?? 0) + 1
    } catch (_) {
        
    }
})
categorieSchema.index({ nome: 1, storeCode: 1 }, { unique: true});

categorieSchema.virtual("products")

categorieSchema.set("toJSON", {virtuals: true});
categorieSchema.set("toObject", {virtuals: true});

const Category = mongoose.model<ICategory>('categories', categorieSchema)

export {Category, ICategory, categorySchemaValidation};

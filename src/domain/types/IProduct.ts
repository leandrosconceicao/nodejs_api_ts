import mongoose from "mongoose";
import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";
import TokenGenerator from "../../utils/tokenGenerator";

export enum AddOneType {
    checkbox = "checkbox",
    range = "range"
}

export const PRODUCT_SCHEMA_VALIDATION = z.object({
    isActive: z.boolean().optional(),
    storeCode: idValidation,
    category: idValidation.optional(),
    preco: z.number().optional(),
    produto: z.string().min(1).optional(),
    tipValue: z.number().optional(),
    hasTipValue: z.boolean().optional(),
    descricao: z.string().optional(),
    preparacao: z.boolean().optional(),
    image: z.string().optional(),
    addOnes: z.array(z.object({
        _id: z.string().default(TokenGenerator.generateId()),
        isRequired: z.boolean(),
    })).optional(),
    images: z.array(z.object({
        filename: z.string().min(1),
        base64: z.string().base64()
    })).optional()
});

export interface IProduct {
    _id?: mongoose.Types.ObjectId,
    isActive: boolean,
    storeCode: mongoose.Types.ObjectId | string,
    category: mongoose.Types.ObjectId | string,
    preco: number,
    produto: string,
    tipValue: number,
    image?: string,
    addOnes?: Array<IProductAddOne>,
    thumbnail: string,
    images?: {
        filename: string,
        link: string,
        base64: string
    }[]
}

export interface ProductFilters {
    _id?: mongoose.Types.ObjectId,
    produto?: RegExp,
    storeCode?: mongoose.Types.ObjectId,
    isActive?: boolean,
    category?: mongoose.Types.ObjectId,
}

export interface IProductAddOne {
    _id: string,
    isRequired?: boolean,
    name: string,
    type: AddOneType,
    maxQtdAllowed: number,
    items: Array<{
        name: string,
        price: number
    }>
}

export const addOneValidation = z.object({
    _id: z.string().min(1).uuid().optional(),
    storeCode: idValidation,
    name: z.string(),
    type: z.nativeEnum(AddOneType).default(AddOneType.checkbox),
    maxQtdAllowed: z.number().optional(),
    items: z.array(z.object({
        name: z.string().min(1),
        price: z.number().default(0.0)
    })).nonempty({ message: "Ao menos 1 item deve ser adicionado" })
}).transform((value) => {
    value._id = TokenGenerator.generateId();
    return value;
});
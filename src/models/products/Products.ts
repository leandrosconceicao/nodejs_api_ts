import mongoose from "mongoose";
import { idValidation } from "../../utils/defaultValidations";
import {z} from "zod";
import TokenGenerator from "../../utils/tokenGenerator";
import { AddOneType, IProductAddOne } from "./AddOnes";

var ObjectId = mongoose.Schema.Types.ObjectId;

const PRODUCT_SCHEMA_VALIDATION = z.object({
  isActive: z.boolean().optional(),
  storeCode: idValidation,
  category: idValidation.optional(),
  preco: z.number().optional(),
  produto: z.string().min(1).optional(),
  tipValue: z.number().optional(),
  hasTipValue: z.boolean().optional(),
  descricao: z.string().optional(),
  preparacao: z.boolean().optional(),
  dataImage: z.object({
      path: z.string().min(1),
      data: z.string().min(1),
  }).optional(),
  image: z.string().optional(),
  addOnes: z.array(z.object({
      _id: z.string().default(TokenGenerator.generateId()),
      isRequired: z.boolean(),
      // type: z.nativeEnum(AddOneType).default(AddOneType.checkbox),
      // name: z.string(),
      // maxQtdAllowed: z.number(),
      // items: z.array(z.object({
      //     name: z.string(),
      //     price: z.number()
      // }))
  })).optional(),
});

interface IProduct {
  _id?: mongoose.Types.ObjectId,
  isActive: boolean,
  storeCode: mongoose.Types.ObjectId,
  category: mongoose.Types.ObjectId,
  preco: number,
  produto: string,
  tipValue: Boolean,
  addOnes?: Array<IProductAddOne>
}

const addSchema = new mongoose.Schema({
  _id: {
    type: String,
    ref: "addOnes",
  },
  isRequired: Boolean,
});

const productSchema = new mongoose.Schema({
  // _id: { type: Number },
  isActive: {
    type: Boolean, 
    default: true,    
  },
  category: {
    type: ObjectId, ref: "categories", required: true
  },
  hasTipValue: {
    type: Boolean,
    default: false
  },
  preco: { type: Number },
  produto: { type: String, 
    required: [true, "Parametro (produto) é obrigatório"],
  },
  descricao: { type: String },
  preparacao: {Boolean},
  storeCode: {type: ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
  addOnes: {
    type: [
      addSchema
    ],
    default: undefined,
  },
  image: {type: String, default: ""}
}, {
  timestamps: true
});

addSchema.virtual("name");
addSchema.virtual("maxQtdAllowed");
addSchema.virtual("items")
addSchema.virtual("type")

addSchema.set("toJSON", {virtuals: true});
addSchema.set("toObject", {virtuals: true});

const Products = mongoose.model<IProduct>("products", productSchema);

export {productSchema, PRODUCT_SCHEMA_VALIDATION, Products, IProduct, IProductAddOne};
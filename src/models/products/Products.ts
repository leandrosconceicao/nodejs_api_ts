import mongoose from "mongoose";
import { idValidation } from "../../utils/defaultValidations";
import {z} from "zod";

var ObjectId = mongoose.Schema.Types.ObjectId;

const PRODUCT_SCHEMA_VALIDATION = z.object({
  isActive: z.boolean().optional(),
  storeCode: idValidation,
  category: idValidation.optional(),
  preco: z.number().optional(),
  produto: z.string().min(1).optional(),
  tipValue: z.number().optional(),
  descricao: z.string().optional(),
  preparacao: z.boolean().optional(),
  dataImage: z.object({
      path: z.string().min(1),
      data: z.string().min(1),
  }).optional(),
  image: z.string().optional(),
  addOnes: z.array(z.object({
      isRequired: z.boolean(),
      productsAddOnes: z.object({
          _id: z.string(),
          name: z.string(),
          // price: z.number(),
          maxQtdAllowed: z.number(),
          items: z.array(z.object({
              name: z.string(),
              price: z.number()
          }))
      })
  })).optional(),
});

const productSchema = new mongoose.Schema({
  // _id: { type: Number },
  isActive: { type: Boolean, 
    required: [true, "Parametro (isActive) é obrigatório"] 
  },
  category: {
    type: ObjectId, ref: "categories", required: true
  },
  tipValue: {
    type: Number,
    default: 0.0
  },
  preco: { type: Number },
  produto: { type: String, 
    required: [true, "Parametro (produto) é obrigatório"],
  },
  createDate: {type: Date, default: () => { return new Date() }},
  descricao: { type: String },
  preparacao: Boolean,
  storeCode: {type: ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
  addOnes: {
    type: [
      {
        isRequired: Boolean,
        productsAddOnes: {
          _id: String,
          // storeCode: String,
          name: String,
          // price: Number,
          maxQtdAllowed: Number,
          items: {
            type: [
              {
                name: String,
                price: Number,
              },
            ],
            default: undefined,
          },
        },
      },
    ],
    default: undefined,
  },
  image: {type: String, default: ""}
});

const Products = mongoose.model("products", productSchema);

export {productSchema, PRODUCT_SCHEMA_VALIDATION, Products};
import mongoose from "mongoose";
import { IProduct } from "../../domain/types/IProduct";

var ObjectId = mongoose.Schema.Types.ObjectId;

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

export {productSchema, Products};
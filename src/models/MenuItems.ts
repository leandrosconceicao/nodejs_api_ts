import mongoose from "mongoose";
import { productSchema } from "./products/Products";

export default mongoose.model("menuItems", new mongoose.Schema({
    nome: { type: String },
    ordenacao: { type: Number },
    products: {
        type: [productSchema],
        default: undefined
    }
}), "categories");
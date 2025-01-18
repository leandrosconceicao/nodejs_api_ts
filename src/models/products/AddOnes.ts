import mongoose from "mongoose"
import { z } from "zod";

const addOneValidation = z.object({
    price: z.number(),
    name: z.string(),
  });

const AddOnes = mongoose.model("addOnes", new mongoose.Schema({
    _id: { type: String },
    storeCode: { type: mongoose.Types.ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
    name: { type: String },
    price: { type: Number },
    maxQtdAllowed: { type: Number },
    items: {
        type: [
            {
                name: String,
                price: Number,
            },
        ],
        default: undefined,
    },
}))

  
export {addOneValidation, AddOnes}
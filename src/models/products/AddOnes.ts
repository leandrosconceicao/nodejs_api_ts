import TokenGenerator from "../../utils/tokenGenerator";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose"
import { z } from "zod";

const addOneValidation = z.object({
    _id: z.string().min(1).uuid().optional(),
    storeCode: idValidation,
    name: z.string(),
    price: z.number().default(0.0),
    maxQtdAllowed: z.number(),
    items: z.array(z.object({
        name: z.string().min(1),
        price: z.number().default(0.0)
    })).nonempty()
  }).transform((value) => {
    value._id = TokenGenerator.generateId();
    return value;
  });

const schema = new mongoose.Schema({
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
}, {
    timestamps: true
});

schema.index({
    _id: 1,
    storeCode: 1,
}, {
    unique: true
})


const AddOnes = mongoose.model("addOnes", schema);

  
export {addOneValidation, AddOnes}
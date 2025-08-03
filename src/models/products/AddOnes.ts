import mongoose from "mongoose"
import { IProductAddOne } from "../../domain/types/IProduct";

const schema = new mongoose.Schema({
    _id: { type: String },
    storeCode: { type: mongoose.Types.ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
    name: { type: String },
    maxQtdAllowed: { type: Number },
    type: {
        type: String,
        default: "checkbox",
        enum: {
            values: ["checkbox", "range"],
            message: "O tipo {VALUE} não é um valor permitido"
        }
    },
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


const AddOnes = mongoose.model<IProductAddOne>("addOnes", schema);


export { AddOnes }
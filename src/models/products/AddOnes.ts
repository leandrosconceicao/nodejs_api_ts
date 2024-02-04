import mongoose from "mongoose"
export default mongoose.model("addOnes", new mongoose.Schema({
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
import mongoose from "mongoose";
import { paymentSchema } from "./Payments";
var ObjectId = mongoose.Types.ObjectId;

const pixPaymentsSchema = new mongoose.Schema({
    storeCode: {type: ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"]},
    createDate: {type: Date, default: () => { return new Date() }},
    updated_at: {type: Date},
    userCreate: {type: ObjectId, ref: "users", required: [true, "Parametro (userCreate) é obrigatório"]},
    txId: {type: String, required: true},
    endToEndId: {type: String},
    status: { type: String,
        default: 'processing',
        enum: {
          values: ['processing', 'finished', 'cancelled'],
          message: "O tipo {VALUE} não é um valor permitido"
        }
      },
    paymentData: paymentSchema
})

const PixPayments = mongoose.model("pixPayments", pixPaymentsSchema);

export default PixPayments;
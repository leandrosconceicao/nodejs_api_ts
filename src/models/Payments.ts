import mongoose from "mongoose";
import { idValidation } from "../utils/defaultValidations";
import { z } from "zod";
var ObjectId = mongoose.Types.ObjectId;

const valueSchema = new mongoose.Schema({
    txId: { type: String, default: undefined },
    cardPaymentId: { type: String, default: undefined },
    method: {
        type: ObjectId,
        ref: "paymentMethods",
        required: [true, "Informe a forma de pagamento"]
    },
    value: { type: Number, required: [true, "Parametro (value) é obrigatório"] },
});

const paymentSchema = new mongoose.Schema({
    accountId: {
        type: ObjectId, ref: 'accounts'
    },
    cashRegisterId: {
        type: ObjectId,
        ref: "cashRegister"
    },
    refunded: { type: Boolean, default: false },
    storeCode: { type: ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
    userCreate: { type: ObjectId, ref: "users"},
    createDate: { type: Date, default: () => { return new Date() }},
    userUpdated: { type: ObjectId, ref: "users", },
    updateDate: { type: Date },
    value: valueSchema
}, {
    timestamps: true
});


const paymentValidation = z.object({
    accountId: idValidation.optional(),
    cashRegisterId: idValidation.optional(),
    refunded: z.boolean().optional(),
    storeCode: idValidation,
    userCreate: idValidation.optional(),
    userUpdated: idValidation.optional(),
    updateDate: z.string().datetime({offset: true}).optional(),
    value: z.object({
        txId: z.string().optional(),
        cardPaymentId: z.string().optional(),
        method: idValidation,
        // form: z.enum(['money', 'debit', 'credit', 'pix']),
        value: z.number()
    })
});

valueSchema.virtual("methodData", {
    ref: "paymentMethods",
    localField: "method",
    foreignField: "_id",
    justOne: true
});


valueSchema.set('toObject', { virtuals: true });
valueSchema.set('toJSON', { virtuals: true });



const Payments = mongoose.model("payments", paymentSchema);

export { paymentSchema, Payments , paymentValidation};
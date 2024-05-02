import mongoose from "mongoose";
import { idValidation } from "../utils/defaultValidations";
import { z } from "zod";
var ObjectId = mongoose.Types.ObjectId;

const valueSchema = new mongoose.Schema({
    txId: { type: String, default: undefined },
    cardPaymentId: { type: String, default: undefined },
    form: {
        type: String,
        default: 'money',
        enum: {
            values: ['money', 'debit', 'credit', 'pix'],
            message: "O tipo {VALUE} não é um valor permitido"
        },
    },
    value: { type: Number, required: [true, "Parametro (value) é obrigatório"] },
});

const paymentSchema = new mongoose.Schema({
    accountId: {
        type: ObjectId, ref: 'accounts'
    },
    refunded: { type: Boolean, default: false },
    storeCode: { type: ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
    userCreate: { type: ObjectId, ref: "users"},
    createDate: { type: Date, default: () => { return new Date() }},
    userUpdated: { type: ObjectId, ref: "users", },
    updateDate: { type: Date },
    value: valueSchema
});


const paymentValidation = z.object({
    accountId: idValidation.optional(),
    refunded: z.boolean().optional(),
    storeCode: idValidation,
    userCreate: idValidation.optional(),
    userUpdated: idValidation.optional(),
    updateDate: z.string().optional(),
    value: z.object({
        txId: z.string().optional(),
        cardPaymentId: z.string().optional(),
        form: z.enum(['money', 'debit', 'credit', 'pix']),
        value: z.number()
    })
});



const Payments = mongoose.model("payments", paymentSchema);

export { paymentSchema, Payments , paymentValidation};
import mongoose from "mongoose";
import { idValidation } from "../utils/defaultValidations";
import { z } from "zod";
import { DateQuery, PeriodQuery } from '../utils/PeriodQuery';
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

const PAYMENT_SEARCH_VALIDATION = z.object({
    storeCode: idValidation,
    accountId: idValidation.optional(),
    cashRegisterId: idValidation.optional(),
    refunded: z.boolean().optional(),
    userCreate: idValidation.optional(),
    createAtStart: z.string().datetime({offset: true}).optional(),
    createAtEnd: z.string().datetime({offset: true}).optional(),
}).transform((value) => {
    interface QuerySearch {
        storeCode: string,
        accountId?: string,
        cashRegisterId?: string,
        refunded?: boolean
        userCreate: string;
        createDate: DateQuery;
    }
    const query = <QuerySearch> {
        storeCode: value.storeCode,
    }
    if (value.accountId) query.accountId = value.accountId;
    if (value.cashRegisterId) query.cashRegisterId = value.cashRegisterId;
    if (value.refunded) query.refunded = value.refunded;
    if (value.userCreate) query.userCreate = value.userCreate;
    if (value.createAtStart && value.createAtEnd) {
        query.createDate = new PeriodQuery(value.createAtStart, value.createAtEnd).build()
    }
    return query;
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

paymentSchema.virtual("userCreateDetail", {
    ref: "users",
    localField: "userCreate",
    foreignField: "_id",
    justOne: true
});

paymentSchema.virtual("userUpdateDetail", {
    ref: "users",
    localField: "userUpdated",
    foreignField: "_id",
    justOne: true
});


paymentSchema.set('toObject', { virtuals: true });
paymentSchema.set('toJSON', { virtuals: true });



const Payments = mongoose.model("payments", paymentSchema);

export { paymentSchema, Payments , paymentValidation, PAYMENT_SEARCH_VALIDATION};
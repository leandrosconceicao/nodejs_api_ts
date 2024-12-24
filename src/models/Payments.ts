import mongoose from "mongoose";
import { idValidation } from "../utils/defaultValidations";
import { z } from "zod";
import { DateQuery, PeriodQuery } from '../utils/PeriodQuery';
import MongoId from "./custom_types/mongoose_types";
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

interface IPayment {
    accountId?: mongoose.Types.ObjectId,
    cashRegisterId: mongoose.Types.ObjectId,
    userCreate: mongoose.Types.ObjectId,
    total: number,
    taxes: number,
    methodData?: {
        _id: mongoose.Types.ObjectId,
        taxes: number,
        created_by: mongoose.Types.ObjectId,
        enabled: boolean,
        storeCode: mongoose.Types.ObjectId,
        description: string,
        createdAt: string,
        updatedAt: string
    }
  }
  

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
    userUpdated: { type: ObjectId, ref: "users", },
    orderId: {type: ObjectId, ref: "orders"},
    method: {
        type: ObjectId,
        ref: "paymentMethods",
        required: [true, "Informe a forma de pagamento"]
    },
    total: {
        type: Number
    },
    taxes: {
        type: Number,
        default: 0.0
    }
    // value: valueSchema
}, {
    timestamps: true
});

const PAYMENT_SEARCH_VALIDATION = z.object({
    storeCode: idValidation,
    from: z.string().datetime({offset: true}),
    to: z.string().datetime({offset: true}),
    method: idValidation.optional(),
    userCreate: idValidation.optional(),
    orderId: idValidation.optional()
}).transform((values) => {
    interface QuerySearch {
        storeCode?: mongoose.Types.ObjectId,
        createdAt?: DateQuery,
        userCreate?: mongoose.Types.ObjectId,
        method?: mongoose.Types.ObjectId,
        orderId?: mongoose.Types.ObjectId,
    }
    const query = <QuerySearch> {}

    query.storeCode = new ObjectId(values.storeCode);
    query.createdAt = new PeriodQuery(values.from, values.to).build();

    if (values.method) {
        query.method = new ObjectId(values.method);
    }

    if (values.userCreate) {
        query.userCreate = new ObjectId(values.userCreate);
    }

    if (values.orderId) {
        query.orderId = new ObjectId(values.orderId);
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
    method: idValidation,
    total: z.number(),
    taxes: z.number().default(0.0)
});

paymentSchema.virtual("methodData", {
    ref: "paymentMethods",
    localField: "method",
    foreignField: "_id",
    justOne: true
});

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

interface IPaymentByMethod {
    description: string,
    _id: string,
    total: number
}


const Payments = mongoose.model("payments", paymentSchema);

export { paymentSchema, Payments , paymentValidation, PAYMENT_SEARCH_VALIDATION, IPayment, IPaymentByMethod};
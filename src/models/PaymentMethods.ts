import mongoose from 'mongoose';
import { idValidation } from '../utils/defaultValidations';
import z from 'zod';
var ObjectId = mongoose.Types.ObjectId;

const PaymentMethodsValidation = z.object({
    created_by: idValidation,
    description: z.string().min(1),
    storeCode: idValidation,
    enabled: z.boolean().default(true)
})

const schema = new mongoose.Schema({
    created_by: {
        type: ObjectId, ref: 'users', required: [true, "Parametro (created_by) é obrigatório"],
    },
    enabled: { type: Boolean, default: true },
    deleted: {
        type: ObjectId,
        default: undefined,
    },
    storeCode: {
        type: ObjectId, ref: 'establishments', required: [true, "Parametro (storeCode) é obrigatório"]
    },
    description: {
        type: String,
        required: [true, "Parametro (description) é obrigatório"],
    },
}, { 
    timestamps: true, 
})

schema.index({ description: 1, storeCode: 1, deleted: -1 }, { unique: true })

schema.virtual("storeData", {
    ref: 'establishments',
    localField: 'storeCode',
    foreignField: '_id',
    justOne: true
})

schema.virtual("createdByData", {
    ref: 'users',
    localField: 'created_by',
    foreignField: '_id',
    justOne: true
})

schema.set('toObject', { virtuals: true });
schema.set('toJSON', { virtuals: true });

const PaymentMethods = mongoose.model('paymentMethods', schema);

export { PaymentMethods, PaymentMethodsValidation };
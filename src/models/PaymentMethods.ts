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
        unique: true
    },
}, { timestamps: true, })

const PaymentMethods = mongoose.model('paymentMethods', schema);

export { PaymentMethods, PaymentMethodsValidation };
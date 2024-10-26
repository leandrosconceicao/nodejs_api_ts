import mongoose from 'mongoose';
import { idValidation } from '../utils/defaultValidations';
import { z } from 'zod';
var ObjectId = mongoose.Types.ObjectId;

const CASH_REGISTER_COMPARE_VALIDATION = z.object({
    cashId: idValidation,
    valuesByMethod: z.array(z.object({
        methodId: idValidation,
        total: z.number()
    }))
});

const CASH_REGISTER_COMPARE_SCHEMA = new mongoose.Schema({
    cashId: {
        type: ObjectId,
        ref: 'cashRegister',
        unique: true,
        index: true
    },
    valuesByMethod: [{
        type: {
            methodId: {
                type: ObjectId,
                ref: 'paymentMethods'
            },
            total: mongoose.Types.Decimal128
        },
        version: false,
    }]
}, { timestamps: true, });

const CashRegisterCompare = mongoose.model("cashRegisterCompare", CASH_REGISTER_COMPARE_SCHEMA);

export {CashRegisterCompare, CASH_REGISTER_COMPARE_VALIDATION}
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

interface ICashRegisterCompare {
    cashId: string,
    valuesByMethod: {
        methodId: string,
        methodData: {
            description: string,
            taxes: number
        },
        total: number
    }[]
}

const CASH_REGISTER_COMPARE_VALUES = new mongoose.Schema({
    methodId: {
        type: ObjectId,
        ref: 'paymentMethods'
    },
    total: Number
})

CASH_REGISTER_COMPARE_VALUES.virtual("methodData", {
    ref: "paymentMethods",
    localField: "methodId",
    foreignField: "_id",
    justOne: true
});

const CASH_REGISTER_COMPARE_SCHEMA = new mongoose.Schema({
    cashId: {
        type: ObjectId,
        ref: 'cashRegister',
        unique: true,
        index: true
    },
    valuesByMethod: [CASH_REGISTER_COMPARE_VALUES]
}, { timestamps: true, });

const CashRegisterCompare = mongoose.model("cashRegisterCompare", CASH_REGISTER_COMPARE_SCHEMA);

export {CashRegisterCompare, CASH_REGISTER_COMPARE_VALIDATION, ICashRegisterCompare}
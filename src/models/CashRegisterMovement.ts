import {z} from "zod";
import mongoose from "mongoose";
import { idValidation } from '../utils/defaultValidations';
var ObjectId = mongoose.Types.ObjectId;

const CASH_MOVEMENT_SCHEMA = new mongoose.Schema({
    cashRegisterId: {
        type: ObjectId,
        ref: "cashregisters",
        required: [true, "ID do caixa deve ser informado"]
    },
    value: {
        type: Number,
        required: [true, "O valor do movimento deve ser informado"]
    },
    description: {
        type: String,
        required: [true, "Informe a descrição da movimentação"]
    },
    type: {
        type: String,
        required: [true, "Informe o tipo do movimento"],
        enum: {
            values: ["supply", "withdraw"],
            message: "O type {VALUE} não é um valor permitido"
        }
    }
}, {
    timestamps: true
});

const CASH_MOVEMENT_VALIDATION = z.object({
    cashRegisterId: idValidation,
    value: z.number().refine(value => {
        return value != 0;
    }, {
        message: "Valor não pode ser 0"
    }),
    description: z.string().min(1),
    type: z.enum(["supply", "withdraw"])
})

const CashRegisterMovements = mongoose.model("cashRegisterMovements", CASH_MOVEMENT_SCHEMA);

export {CASH_MOVEMENT_VALIDATION, CashRegisterMovements};
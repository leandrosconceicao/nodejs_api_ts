import mongoose from 'mongoose';
import { idValidation } from '../utils/defaultValidations';
import z from 'zod';
var ObjectId = mongoose.Types.ObjectId;

const movementSchema = new mongoose.Schema({
    value: {
        type: mongoose.Types.Decimal128,
        required: [true, "O valor do movimento deve ser informado"]
    },
    paymentMethodId: {
        type: ObjectId,
        required: [true, "Informe o ID da forma de pagamento"],
        ref: "paymentMethods"
    },
    type: {
        type: String,
        required: [true, "Informe o tipo do movimento"],
        enum: {
            values: ["supply", "withdraw"],
            message: "O type {VALUE} não é um valor permitido"
        }
    },
});

const cashMovementValidation = z.object({
    value: z.number().refine(value => {
        return value != 0;
    }, {
        message: "Valor não pode ser 0"
    }),
    paymentMethodId: idValidation,
    type: z.enum(["supply", "withdraw"])
})

const cashRegisterCreationValidation = z.object({
    storeCode: idValidation,
    created_by: idValidation,
    openAt: z.string().datetime({offset: true}).optional(),
    closedAt: z.string().datetime({offset: true}).optional(),
    // status: z.enum(["open", "closed"]),
    movements: z.array(cashMovementValidation)
})

const cashRegisterValidationOptional = z.object({
    storeCode: idValidation.optional(),
    created_by: idValidation.optional(),
    openAt: z.string().datetime({offset: true}).optional(),
    closedAt: z.string().datetime({offset: true}).optional(),
    status: z.enum(["open", "closed"]).optional(),
    movements: z.array(cashMovementValidation).optional()
})

const cashRegisterSchema = new mongoose.Schema({
    storeCode: {
        type: ObjectId,
        ref: "establishments",
        required: [true, "Informe o ID do estabelecimento"]
    },
    created_by: {
        type: ObjectId,
        ref: 'users',
        required: [true, "Informe o ID do usuário"]
    },
    openAt: {
        type: Date,
        default: () => { new Date() }
    },
    closedAt: {
        type: Date
    },
    status: {
        type: String,
        default: "open",
        enum: {
            values: ['open', 'closed'],
            message: "o status {VALUE} não é um valor permitido"
        }
    },
    movements: {
        type: [movementSchema],
    }
});

const CashRegister = mongoose.model('cashRegister', cashRegisterSchema);


export { CashRegister, cashRegisterCreationValidation, cashMovementValidation };
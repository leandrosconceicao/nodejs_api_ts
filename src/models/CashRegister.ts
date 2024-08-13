import mongoose from 'mongoose';
import { idValidation } from '../utils/defaultValidations';
import z from 'zod';
import { DateQuery, PeriodQuery } from '../utils/PeriodQuery';
import { ArraySearch, ElementMatch } from './base/MongoDBFilters';
var ObjectId = mongoose.Types.ObjectId;

const movementSchema = new mongoose.Schema({
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

const cashMovementValidation = z.object({
    value: z.number().refine(value => {
        return value != 0;
    }, {
        message: "Valor não pode ser 0"
    }),
    description: z.string().min(1),
    type: z.enum(["supply", "withdraw"])
})

const cashRegisterCreationValidation = z.object({
    storeCode: idValidation,
    created_by: idValidation,
    openAt: z.string().datetime({offset: true}).optional(),
    closedAt: z.string().datetime({offset: true}).optional(),
    movements: z.array(cashMovementValidation)
})

const cashRegisterValidationOptional = z.object({
    storeCode: idValidation,
    created_by: idValidation.optional(),
    openAtStart: z.string().datetime({offset: true}).optional(),
    openAtEnd: z.string().datetime({offset: true}).optional(),
    closedAtStart: z.string().datetime({offset: true}).optional(),
    closedAtEnd: z.string().datetime({offset: true}).optional(),
    status: z.enum(["open", "closed"]).optional(),
    deleted: z.object({}).optional(),
    movement_type: z.enum(["withdraw", "supply"]).optional()
}).transform((data) => {
    interface QuerySearch {
        storeCode: string,
        created_by?: string,
        openAt: DateQuery,
        closedAt: DateQuery,
        status?: string,
        deleted: any,
        movements?: ElementMatch
    };
    let query = <QuerySearch> {
        storeCode: data.storeCode,
        deleted: data.deleted,
    };
    if (data.created_by) {
        query.created_by = data.created_by;
    }
    if (data.status) {
        query.status = data.status;
    }
    if (data.openAtStart && data.openAtEnd) {
        query.openAt = new PeriodQuery(data.openAtStart, data.openAtEnd).build()
    }
    if (data.closedAtStart && data.closedAtEnd) {
        query.closedAt = new PeriodQuery(data.closedAtStart, data.closedAtEnd).build()
    }
    if (data.movement_type) {
        query.movements = new ArraySearch({
            type: data.movement_type
        }).build()
    }
    return query;
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
        default: () => { return new Date() }
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
    },
    deleted: {
        type: ObjectId,
        default: undefined
    }
});

const CashRegister = mongoose.model('cashRegister', cashRegisterSchema);


export { CashRegister, cashRegisterCreationValidation, cashMovementValidation, cashRegisterValidationOptional };
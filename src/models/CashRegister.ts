import mongoose from 'mongoose';
import { idValidation } from '../utils/defaultValidations';
import z from 'zod';
import { DateQuery, PeriodQuery } from '../utils/PeriodQuery';
import { ElementMatch } from './base/MongoDBFilters';
var ObjectId = mongoose.Types.ObjectId;

const CASHREGISTER_VALUES_SCHEMA = new mongoose.Schema({
    value: {
        type: Number,
        required: [true, "Valor deve ser informado"],
    },
    paymentMethodId: {
        type: ObjectId,
        ref: "paymentmethods",
        required: [true, "ID da forma de pagamento é obrigatório"]
    }
}, {
    timestamps: true
});


// const CASH_REGISTER_VALUES_VALIDATION = z.object({
//     value: z.number().refine(value => {
//         return value != 0;
//     }, {
//         message: "Valor não pode ser 0"
//     }),
//     paymentMethodId: idValidation
// })

const cashRegisterCreationValidation = z.object({
    storeCode: idValidation,
    created_by: idValidation.optional(),
    openValue: z.number().optional(),
    // openValues: z.array(CASH_REGISTER_VALUES_VALIDATION).optional()
}).strict()

const cashRegisterValidationOptional = z.object({
    storeCode: idValidation,
    created_by: idValidation.optional(),
    openAtStart: z.string().datetime({offset: true}).optional(),
    openAtEnd: z.string().datetime({offset: true}).optional(),
    closedAtStart: z.string().datetime({offset: true}).optional(),
    closedAtEnd: z.string().datetime({offset: true}).optional(),
    status: z.enum(["open", "closed"]).optional(),
    deleted: z.object({}).optional(),
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
    openValue: {
        type: Number,
        default: 0.0
    },
    deleted: {
        type: ObjectId,
        default: undefined
    },
    paymentsByMethod: {
        type: [],
        default: undefined
    }
});

// CASHREGISTER_VALUES_SCHEMA.virtual("paymentMethodDetail", {
//     ref: 'paymentMethods',
//     localField: 'paymentMethodId',
//     foreignField: '_id',
//     justOne: true
// })

cashRegisterSchema.virtual("storeDetail", {
    ref: 'establishments',
    localField: 'storeCode',
    foreignField: '_id',
    justOne: true
})

// cashRegisterSchema.virtual("payments", {
//     ref: 'payments',
//     localField: 'created_by',
//     foreignField: 'userCreate',
// })

cashRegisterSchema.virtual("userDetail", {
    ref: 'users',
    localField: 'created_by',
    foreignField: '_id',
    justOne: true,
    
})

cashRegisterSchema.virtual("suppliersAndWithdraws", {
    ref: 'cashRegisterMovements',
    localField: '_id',
    foreignField: 'cashRegisterId',
})

cashRegisterSchema.virtual("cashRegisterCompare", {
    ref: 'cashRegisterCompare',
    localField: '_id',
    foreignField: 'cashId'
});

CASHREGISTER_VALUES_SCHEMA.set('toObject', { virtuals: true });
CASHREGISTER_VALUES_SCHEMA.set('toJSON', { virtuals: true });
cashRegisterSchema.set('toObject', { virtuals: true });
cashRegisterSchema.set('toJSON', { virtuals: true });

const CashRegister = mongoose.model('cashRegister', cashRegisterSchema);


export { CashRegister, cashRegisterCreationValidation, cashRegisterValidationOptional };
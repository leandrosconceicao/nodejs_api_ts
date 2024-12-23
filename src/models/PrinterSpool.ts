import mongoose from "mongoose";
import {z} from "zod";
import MongoId from "./custom_types/mongoose_types";
import { idValidation } from "../utils/defaultValidations";
var ValidationError = mongoose.Error.ValidationError;

var ObjectId = mongoose.Types.ObjectId;

const printer_spool_schema = new mongoose.Schema({
    storeCode: {
        type: ObjectId,
        ref: "establishments",
        require: [true, "ID do estabelecimento é obrigatório"]
    },
    orderId: {
        type: ObjectId,
        ref: "orders",
    },
    accountId: {
        type: ObjectId,
        ref: "accounts"
    },
    type: {
        type: String,
        default: "order",
        require: [true, "type é obrigatório, informe um valor valido: (order, account_receipt, other)"],
        enum: {
            values: ["order", "account_receipt", "other"],
            message: "O tipo {VALUE} não é um valor permitido"
        }
    },
    reprint: {
        type: Boolean,
        default: false
    },
    buffer: {
        type: String
    }
}, {
    timestamps: true,
});

printer_spool_schema.pre('validate', function(next) {
    if (!this.orderId && !this.accountId) {
        const err = new ValidationError()
        err.errors.orderId = new mongoose.Error.ValidatorError({
            message: 'At least one of orderId or accountId must be present.',
            path: 'orderId',
            value: this.orderId
          })
          next(err);
    }
    next();
});

const PRINTER_SPOOL_VALIDATION = z.object({
    storeCode: idValidation,
    type: z.enum(["order", "account_receipt", "other"]),
    reprint: z.boolean().default(false),
    createdAt: z.string().datetime({offset: true}).optional(),
}).and(
    z.union([
        z.object({
            accountId: idValidation
        }), 
        z.object({
            orderId: idValidation
        })
    ])
)

enum SpoolType {
    order = "order",
    account_receipt = "account_receipt",
    other = "other",
}

interface IPrinterSpool {
    storeCode?: MongoId | string,
    reprint: boolean,
    orderId?: MongoId | string,
    accountId?: MongoId | string,
    type: SpoolType,
    buffer?: string,
    createdAt?: Date | string,
}

const PrinterSpool = mongoose.model("printerSpool", printer_spool_schema);

export {PrinterSpool, IPrinterSpool, SpoolType, PRINTER_SPOOL_VALIDATION};
import mongoose from "mongoose";
import { ObjectId } from "../controllers/orders/ordersController";
import { IPrinters } from "../domain/types/IPrinters";
import { SpoolType } from "../domain/types/IPrinterSpool";

const SPOOL_SCHEMA = {
        enabled: {type: Boolean, default: false},
        type: {
            type: String, default: SpoolType.order,
            enum: {
                values: Object.values(SpoolType),
                message: "O tipo {VALUE} não é um valor permitido"
            }
        },
    };

const PRINT_SCHEMA = new mongoose.Schema({
    address: { type: String, require: true },
    name: { type: String, require: true },
    storeCode: {
        type: ObjectId,
        require: true,
        ref: "establishments"
    },
    spools: {
        type: [
            SPOOL_SCHEMA
        ],
        validate: {
            validator: function (data: Array<any>) {
                return data.length
            },
            message: "Necessário informar as filas de impressão"
        }
    },
    deleted: {type: Boolean, default: false}
}, {
    timestamps: true,
    versionKey: false,
})

PRINT_SCHEMA.index(
    { address: 1, storeCode: 1},
    { unique: true, partialFilterExpression: { deleted: false } }
);

const Printers = mongoose.model<IPrinters>("printers", PRINT_SCHEMA)

export default Printers;
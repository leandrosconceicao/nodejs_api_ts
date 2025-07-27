import {z} from "zod";
import MongoId from "../../models/custom_types/mongoose_types";
import { idValidation } from "../../utils/defaultValidations";
import { IPrinters } from "./IPrinters";

enum SpoolType {
    order = "order",
    account_receipt = "account_receipt",
    cashRegister = "cashRegister",
    other = "other",
}

const PRINTER_SPOOL_VALIDATION = z.object({
    storeCode: idValidation,
    type: z.nativeEnum(SpoolType),
    reprint: z.boolean().default(false),
    createdAt: z.string().datetime({offset: true}).optional(),
}).and(
    z.union([
        z.object({
            accountId: idValidation
        }), 
        z.object({
            orderId: idValidation
        }),
        z.object({
            cashRegisterId: idValidation
        })
    ])
)


interface IPrinterSpool {
    storeCode?: MongoId | string,
    reprint: boolean,
    orderId?: MongoId | string,
    accountId?: MongoId | string,
    cashRegisterId?: MongoId | string,
    type: SpoolType,
    buffer?: string,
    createdAt?: Date | string,
    // printer?: IPrinters,
    printers?: IPrinters[]
}

export {IPrinterSpool, SpoolType, PRINTER_SPOOL_VALIDATION};
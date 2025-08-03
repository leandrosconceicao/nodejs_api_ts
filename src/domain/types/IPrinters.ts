import { z } from "zod";
import MongoId from "../../models/custom_types/mongoose_types";
import { idValidation, macAddressValidation } from "../../utils/defaultValidations";
import { SpoolType } from "./IPrinterSpool";

interface IPrinters {
    _id?: string,
    address: string,
    name: string,
    storeCode: string | MongoId,
    spools: Array<{
        type: SpoolType,
        enabled: boolean
    }>,
    deleted?: boolean
}

const SPOOL_VALIDATION = z.array(z.object({
        enabled: z.boolean().default(false),
        type: z.nativeEnum(SpoolType, {
            message: `Informe um tipo válido [${Object.values(SpoolType).join(", ")}]`
        }),
    }));


const PRINTER_VALIDATION = z.object({
    address: macAddressValidation,
    name: z.string({
        message: "campo obrigatório"
    }).min(1),
    storeCode: idValidation,
    spools: SPOOL_VALIDATION
        .nonempty()
        .refine(arr => new Set(arr.map((e) => e.type)).size === arr.length, {
            message: "Fila de impressão possui itens duplicados"
        })
});

export {PRINTER_VALIDATION, IPrinters, SPOOL_VALIDATION};
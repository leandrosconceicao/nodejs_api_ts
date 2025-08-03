import {z} from "zod";
import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;

const idValidation = z.string({
    required_error: "Campo obrigatório"
}).refine(value => {
    return ObjectId.isValid(value);
}, {
    message: "ID inválido"
});

function decimalValidation(message: string) {
    return z.number().refine(value => {
        return value === 0.0 || value === 1.0 || !Number.isInteger(value);
        }, {
        message: message
    });
}

const booleanStringValidation = z.string().toLowerCase()
    .refine((value) => value === "true" || value === "false", {
    message: "Value must be a boolean",
    })
    .transform((value) => value === "true");

const macAddressRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const macAddressValidation = z.string({
    message: "campo obrigatório"
}).min(1, { message: "campo obrigatório" })
  .regex(macAddressRegex, { message: "MAC address inválido" });

export {idValidation, booleanStringValidation, decimalValidation, macAddressValidation};
import {z} from "zod";
import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;

const idValidation = z.string().refine(value => {
    return ObjectId.isValid(value);
}, {
    message: "ID inválido"
});

const booleanStringValidation = z.string().toLowerCase()
    .refine((value) => value === "true" || value === "false", {
    message: "Value must be a boolean",
    })
    .transform((value) => value === "true");

export {idValidation, booleanStringValidation};
import {z} from "zod";
import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;

const idValidation = z.string().refine(value => {
    return ObjectId.isValid(value);
}, {
    message: "ID inválido"
});

export {idValidation};
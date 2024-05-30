import mongoose from "mongoose";
import { clientsSchema, clientsSchemaValidation } from "./Clients";
import {z} from "zod";
import { idValidation } from "../utils/defaultValidations";

var ObjectId = mongoose.Types.ObjectId;

const accountStatus = ['open', 'closed', 'checkSolicitation'];

const accountValidation = z.object({
    description: z.string().min(1),
    storeCode: idValidation.optional(),
    updateAt: z.date().optional(),
    status: z.enum(["open", "closed", "checkSolicitation"]).optional(),
    client: clientsSchemaValidation.optional(),
    created_by: idValidation.optional()
});

const Accounts = mongoose.model("accounts", new mongoose.Schema({
    deleted_id: {type: mongoose.Types.ObjectId, default: undefined},
    description: { type: String, required: [true, "Parametro (description) é obrigatório"] },
    storeCode: { type: String, required: [true, "Parametro (storeCode) é obrigatório"] },
    createDate: { type: Date, default: () => {return new Date();}},
    updatedAt: {type: Date},
    status: {
        type: String,
        required: true,
        default: 'open',
        enum: {
            values: accountStatus,
            message: "O tipo {VALUE} não é um valor de STATUS permitido"
        }
    },
    client: {
        type: clientsSchema
    },
    created_by: {
        type: ObjectId, ref: 'users', required: [true, "Parametro (created_by) é obrigatório"]
    },
    orders: {},
    payments: {}
}))

export {accountStatus, Accounts, accountValidation};
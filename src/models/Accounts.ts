import mongoose from "mongoose";
import { clientsSchema } from "./Clients";

var ObjectId = mongoose.Types.ObjectId;

const accountStatus = ['open', 'closed', 'checkSolicitation'];

const Accounts = mongoose.model("accounts", new mongoose.Schema({
    description: { type: String, required: [true, "Parametro (description) é obrigatório"] },
    storeCode: { type: String, required: [true, "Parametro (storeCode) é obrigatório"] },
    createDate: { type: Date, default: () => {return new Date();}},
    updatedAt: {type: Date},
    status: {
        type: String,
        required: true,
        default: 'open',
        enum: {
            values: ['open', 'closed', 'checkSolicitation'],
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

export {accountStatus, Accounts};
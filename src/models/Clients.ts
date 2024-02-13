import mongoose from "mongoose";

const clientsSchema = new mongoose.Schema({
    cgc: { type: String, required: true, unique: true },
    name: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false },
    isValid: { type: Boolean, default: undefined },
    storeCode: {type: mongoose.Types.ObjectId, ref: "establishments"},
    phoneNumber: { type: String },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    address: {
        type: [{
            id: String,
            address: String,
            city: String,
            complement: String,
            distric: String,
            number: String,
            state: String,
            zipCode: String,
        }],
        _id: false,
        default: undefined,
        version: false,
    },
})

const Clients = mongoose.model('clients', clientsSchema)

export default Clients;

import mongoose from "mongoose";

const clientsSchema = new mongoose.Schema({
    cgc: { type: String , default: ""},
    name: { type: String , default: ""},
    email: { type: String, lowercase: true , default: ""},
    // password: { type: String, select: false },
    // isValid: { type: Boolean, default: undefined },
    storeCode: {type: mongoose.Types.ObjectId, required: true, ref: "establishments"},
    phoneNumber: { type: String , default: ""},
    createDate: { type: Date, default: () => {return new Date();}},
    // passwordResetToken: { type: String, select: false },
    // passwordResetExpires: { type: Date, select: false },
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

export {clientsSchema};

// const Clients = mongoose.model('clients', clientsSchema)

// export default Clients;

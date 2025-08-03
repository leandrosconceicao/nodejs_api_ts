import mongoose from "mongoose";
import { z } from "zod";

const clientsSchemaValidation = z.object({
    cgc: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    phoneNumber: z.string().optional(),
    address: z.array(z.object({
        address: z.string().optional(),
        city: z.string().optional(),
        complement: z.string().optional(),
        district: z.string().optional(),
        number: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional()
    })).nonempty().optional(),
}).default({
    cgc: "",
    name: "",
    email: "",
    phoneNumber: "",
})

export const clientDeliveryAddressValidation = z.object({
    address: z.string(),
    city: z.string(),
    complement: z.string().optional(),
    district: z.string(),
    number: z.string(),
    state: z.string(),
    zipCode: z.string()
});

export const clientsBasicInfoValidation = z.object({
    cgc: z.string().optional(),
    name: z.string(),
    email: z.string().optional(),
    phoneNumber: z.string(),
    address: z.string(),
    city: z.string(),
    complement: z.string().optional(),
    district: z.string(),
    number: z.string(),
    state: z.string(),
    zipCode: z.string()
})


export const clientsCreationValidation = z.object({
    cgc: z.string().optional(),
    name: z.string(),
    email: z.string().optional(),
    phoneNumber: z.string(),
    address: z.array(clientDeliveryAddressValidation).nonempty(),
})

export const deliveryAddressSchema = new mongoose.Schema({
    address: String,
    city: String,
    complement: String,
    district: String,
    number: String,
    state: String,
    zipCode: String,
})

export const clientBasicInfoSchema = new mongoose.Schema({
    cgc: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, lowercase: true, default: "" },
    phoneNumber: { type: String, default: "" },
    address: String,
    city: String,
    complement: String,
    district: String,
    number: String,
    state: String,
    zipCode: String,
})

const clientsSchema = new mongoose.Schema({
    cgc: { type: String, default: "" },
    name: { type: String, default: "" },
    email: { type: String, lowercase: true, default: "" },
    // password: { type: String, select: false },
    // isValid: { type: Boolean, default: undefined },
    // storeCode: {type: mongoose.Types.ObjectId, required: true, ref: "establishments"},
    phoneNumber: { type: String, default: "" },
    // passwordResetToken: { type: String, select: false },
    // passwordResetExpires: { type: Date, select: false },
    address: {
        type: [deliveryAddressSchema],
        _id: false,
        default: undefined,
        version: false,
    },
})

export interface IClientAddress {
    address?: string,
    city?: string,
    complement?: string,
    district?: string,
    number?: string,
    state?: string,
    zipCode?: string,
}

export interface IClientBasicInfo {
    cgc?: string,
    name?: string,
    email?: string,
    phoneNumber?: string,
    address?: string,
    city?: string,
    complement?: string,
    district?: string,
    number?: string,
    state?: string,
    zipCode?: string,
}

interface IClient {
    cgc?: string,
    name?: string,
    email?: string,
    phoneNumber?: string,
    address?: Array<IClientAddress>
}

export { clientsSchema, clientsSchemaValidation, IClient };

// const Clients = mongoose.model('clients', clientsSchema)

// export default Clients;

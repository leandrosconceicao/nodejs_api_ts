import mongoose from "mongoose";
import {z} from "zod";

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

const clientsSchema = new mongoose.Schema({
    cgc: { type: String , default: ""},
    name: { type: String , default: ""},
    email: { type: String, lowercase: true , default: ""},
    // password: { type: String, select: false },
    // isValid: { type: Boolean, default: undefined },
    // storeCode: {type: mongoose.Types.ObjectId, required: true, ref: "establishments"},
    phoneNumber: { type: String , default: ""},
    createDate: { type: Date, default: () => {return new Date();}},
    // passwordResetToken: { type: String, select: false },
    // passwordResetExpires: { type: Date, select: false },
    address: {
        type: [{
            // id: String,
            address: String,
            city: String,
            complement: String,
            district: String,
            number: String,
            state: String,
            zipCode: String,
        }],
        _id: false,
        default: undefined,
        version: false,
    },
})

interface IClient {
    cgc?: string,
    name?: string,
    email?: string,
    phoneNumber?: string,
    address?: Array<{
      address?: string,
      city?: string,
      complement?: string,
      district?: string,
      number?: string,
      state?: string,
      zipCode?: string,
    }>
  }

export {clientsSchema, clientsSchemaValidation, IClient};

// const Clients = mongoose.model('clients', clientsSchema)

// export default Clients;

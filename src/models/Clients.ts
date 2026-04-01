import mongoose from "mongoose";
import { z } from "zod";

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
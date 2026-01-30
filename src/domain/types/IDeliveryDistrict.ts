import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose";

export const cepValidation = z.string().regex(/^\d{8}$/, "Formato inválido");

export const deliveryDistrictValidation = z.object({
    storeCode: idValidation,
    cep: cepValidation,
    description: z.string(),
    value: z.number()
})
export interface IDeliveryDistrict {
    _id?: string | mongoose.Types.ObjectId, 
    storeCode: string | mongoose.Types.ObjectId,
    description: string,
    value: number,
    cep: string,
    createdAt?: string,
    updatedAt?: string,
    deleted?: boolean
}
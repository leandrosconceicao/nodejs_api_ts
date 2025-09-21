import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose";

export const deliveryDistrictValidation = z.object({
    storeCode: idValidation,
    description: z.string(),
    value: z.number()
})
export interface IDeliveryDistrict {
    _id?: string | mongoose.Types.ObjectId, 
    storeCode: string | mongoose.Types.ObjectId,
    description: string,
    value: number
    createdAt?: string,
    updatedAt?: string
}
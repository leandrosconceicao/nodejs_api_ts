import { z } from "zod";
import MongoId from "../../models/custom_types/mongoose_types";
import { idValidation } from "../../utils/defaultValidations";

export const deliveryDistrictValidation = z.object({
    storeCode: idValidation,
    districts: z.array(z.object({
        description: z.string(),
        value: z.number()
    })).nonempty(),
})

export interface IDeliveryDistrictValues {
    description: string,
    value: number
}

export interface IDeliveryDistrict {
    _id?: string | MongoId, 
    storeCode: string | MongoId,
    districts: IDeliveryDistrictValues[],
    createdAt?: string,
    updatedAt?: string
}
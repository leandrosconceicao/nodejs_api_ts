import { z } from "zod"
import { clientsBasicInfoValidation, IClientBasicInfo } from "../../models/Clients"
import MongoId from "../../models/custom_types/mongoose_types"
import { IOrderProduct, orderProductValidation, OrderStatus } from "../../models/Orders"
import { idValidation } from "../../utils/defaultValidations"
import { IEstablishments } from "../../models/Establishments"

export const deliveryOrdersValidation = z.object({
    storeCode: idValidation,
    client: clientsBasicInfoValidation,
    deliveryTax: z.number(),
    status: z.nativeEnum(OrderStatus).default(OrderStatus.pending),
    paymentMethod: idValidation,
    deliveryDistrictId: idValidation,
    products: z.array(orderProductValidation).nonempty()
})

export const deliveryOrdersSearchValidation = z.object({
    from: z.string().datetime({
        offset: true
    }).optional(),
    to: z.string().datetime({
        offset: true
    }).optional(),
    orderId: idValidation.optional(),
    status: z.union([
        z.array(z.nativeEnum(OrderStatus)),
        z.nativeEnum(OrderStatus)
    ]).optional(),
    paymentMethod: z.union([
        idValidation,
        z.array(idValidation)
    ]).optional(),
    clientPhoneNumber: z.string().optional()
})

export const deliveryOrdersUpdateValidation = z.object({
    orderId: idValidation.optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    client: clientsBasicInfoValidation.optional(),    
})

export interface ISearchDeliveryOrder {
    _id: string,
    orderId: string,
    from: string,
    to: string,
    status: string | string[],
    paymentMethod: string | string[],
    clientPhoneNumber: string
}

export interface IDeliveryOrder {
    _id?: string | MongoId,
    deliveryDistrictId: string | MongoId,
    deliveryTax?: number,
    subTotal?: number,
    orderId?: string | MongoId,
    storeCode: string | MongoId,
    createdAt?: Date,
    client: IClientBasicInfo,
    status: OrderStatus,
    paymentMethod: string,
    paymentMethodDetail?: any,
    establishmentDetail?: IEstablishments,
    products: Array<IOrderProduct>,
    totalProduct?: number,
    observation?: string,
}
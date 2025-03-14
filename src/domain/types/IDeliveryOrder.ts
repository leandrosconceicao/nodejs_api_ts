import { z } from "zod"
import { clientDeliveryAddressValidation, clientsBasicInfoValidation, IClient, IClientAddress, IClientBasicInfo } from "../../models/Clients"
import MongoId from "../../models/custom_types/mongoose_types"
import { IOrderProduct, orderProductValidation, OrderStatus } from "../../models/Orders"
import { idValidation } from "../../utils/defaultValidations"
import { IEstablishments } from "../../models/Establishments"

export const deliveryOrdersValidation = z.object({
    storeCode: idValidation,
    client: clientsBasicInfoValidation,
    status: z.nativeEnum(OrderStatus).default(OrderStatus.pending),
    paymentMethod: idValidation,
    products: z.array(orderProductValidation).nonempty()
})

export const deliveryOrdersSearchValidation = z.object({
    storeCode: idValidation,
    from: z.string().datetime({
        offset: true
    }),
    to: z.string().datetime({
        offset: true
    }),
    orderId: idValidation.optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    paymentMethod: idValidation.optional(),
})

export const deliveryOrdersUpdateValidation = z.object({
    orderId: idValidation.optional(),
    status: z.nativeEnum(OrderStatus).optional(),
    client: clientsBasicInfoValidation.optional(),    
})

export interface ISearchDeliveryOrder {
    _id: string,
    orderId: string,
    storeCode: string,
    from: string,
    to: string,
    status: string,
    paymentMethod: string
}

export interface IDeliveryOrder {
    _id?: string | MongoId,
    deliveryTax?: number,
    orderId?: string | MongoId,
    storeCode: string | MongoId,
    createdAt?: Date | string,
    client: IClientBasicInfo,
    status: OrderStatus,
    paymentMethod: string,
    paymentMethodDetail?: any,
    establishmentDetail?: IEstablishments,
    products: Array<IOrderProduct>
}
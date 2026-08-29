import MongoId from "../../../models/custom_types/mongoose_types";
import { OrderStatus, IOrderProduct } from "../../../models/Orders";
import { IDeliveryOrder } from "../../../domain/types/IDeliveryOrder";
import { ClientDto } from "../client/client_dto";
import { EstablishmentResponseDto } from "../establishment/establishment_dto";

export class DeliveryOrderDto {
    _id?: string | MongoId;
    deliveryDistrictId: string | MongoId;
    deliveryTax?: number;
    subTotal?: number;
    orderId?: string | MongoId;
    storeCode: string | MongoId;
    createdAt?: Date;
    client: ClientDto;
    status: OrderStatus;
    paymentMethod: string;
    paymentMethodDetail?: any;
    products: IOrderProduct[];
    totalProduct?: number;
    observation?: string;

    constructor(order: IDeliveryOrder) {
        this._id = order._id;
        this.deliveryDistrictId = order.deliveryDistrictId;
        this.deliveryTax = order.deliveryTax;
        this.subTotal = order.subTotal;
        this.orderId = order.orderId;
        this.storeCode = order.storeCode;
        this.createdAt = order.createdAt;
        this.client = new ClientDto(order.client);
        this.status = order.status;
        this.paymentMethod = order.paymentMethod;
        this.paymentMethodDetail = order.paymentMethodDetail;
        this.products = order.products;
        this.totalProduct = order.totalProduct;
        this.observation = order.observation;
    }

    static toList(orders: IDeliveryOrder[]) {
        return orders.map((e) => new DeliveryOrderDto(e))
    }
}
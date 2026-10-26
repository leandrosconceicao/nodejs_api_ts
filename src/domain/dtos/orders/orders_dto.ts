import { IAccount } from "../../../models/Accounts";
import MongoId from "../../../models/custom_types/mongoose_types";
import { IEstablishments } from "../../../models/Establishments";
import { IPayment } from "../../../models/Payments";
import { IUsers } from "../../../models/Users";
import { IOrder, IOrderProduct, OrderStatus, OrderType } from "../../../models/Orders";
import { ClientDto } from "../client/client_dto";

export class OrderDto implements IOrder {
    _id?: string | MongoId;
    pedidosId?: number;
    firebaseToken?: string;
    accountId: string | MongoId;
    deliveryTax?: number;
    orderType?: OrderType;
    accepted?: boolean;
    discount?: number;
    status?: OrderStatus;
    products: IOrderProduct[];
    client?: ClientDto;
    createdBy?: string | MongoId;
    updatedBy?: string | MongoId;
    storeCode: string | MongoId;
    paymentMethod: string | MongoId;
    createdAt?: Date;
    userCreate?: IUsers;
    accountDetail?: IAccount;
    storeCodeDetail?: IEstablishments;
    paymentDetail?: IPayment;
    subTotal?: number;
    totalProduct?: number;
    totalTip?: number;

    constructor(order: IOrder) {
        this._id = order._id;
        this.pedidosId = order.pedidosId;
        this.firebaseToken = order.firebaseToken;
        this.accountId = order.accountId;
        this.deliveryTax = order.deliveryTax;
        this.orderType = order.orderType;
        this.accepted = order.accepted;
        this.discount = order.discount;
        this.status = order.status;
        this.products = order.products;
        this.client = order.client ? new ClientDto(order.client) : undefined;
        this.createdBy = order.createdBy;
        this.updatedBy = order.updatedBy;
        this.storeCode = order.storeCode;
        this.paymentMethod = order.paymentMethod;
        this.createdAt = order.createdAt;
        this.userCreate = order.userCreate;
        this.accountDetail = order.accountDetail;
        this.storeCodeDetail = order.storeCodeDetail;
        this.paymentDetail = order.paymentDetail;
        this.subTotal = order.subTotal;
        this.totalProduct = order.totalProduct;
        this.totalTip = order.totalTip;
    }

    static toList(orders: IOrder[]) {
        return orders.map((e) => new OrderDto(e))
    }
}
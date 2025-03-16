import { IOrder, IOrderSearchQuery } from "../../models/Orders";
import { IDeliveryOrder, ISearchDeliveryOrder } from "../types/IDeliveryOrder";

export default interface IOrderRepository {

    findOne(id: string) : Promise<IOrder>;

    findAll(query: Partial<IOrderSearchQuery>) : Promise<Array<IOrder>>;

    delete(id: string, updatedById: string) : Promise<IOrder>;

    setPreparation(id: string, updateById: string, isReady: boolean) : Promise<IOrder>;

    setPreparationBatch(updateById: string, orders: {id: string, isReady: boolean}[]) : Promise<{order: IOrder, isReady: boolean}[]>

    changeSeller(orderId: string, userIdTo: string, updatedById: string) : Promise<IOrder>;

    applyDiscount(orderId: string, discount: number, updatedById: string) : Promise<IOrder>;

    getOrdersFromAccount(accountId: string) : Promise<Array<IOrder>>;

    finishOrdersOnCloseAccount(accountId: string) : Promise<void>;

    createOrder(data: IOrder): Promise<IOrder>

    updateId(id: string, storeCode: string) : Promise<void>;

    manageTipValue(storeCode: string, accountId: string, enabledTip: boolean) : Promise<void>;

    requestDeliveryOrder(order: IDeliveryOrder) : Promise<IDeliveryOrder>;

    getDeliveryOrderById(id: string) : Promise<IDeliveryOrder>;

    getDeliveryOrders(query: Partial<ISearchDeliveryOrder>) : Promise<IDeliveryOrder[]>;

    getDeliveryOrderByOrderId(orderId: string) : Promise<IDeliveryOrder>;

    updateDeliveryOrder(id: string, data: Partial<IDeliveryOrder>) : Promise<IDeliveryOrder>;
}
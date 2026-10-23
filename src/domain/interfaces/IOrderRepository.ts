import { IOrder, IOrderSearchQuery } from "../../models/Orders";
import { IDeliveryOrder, IDeliveryOrderAggregated, ISearchDeliveryOrder } from "../types/IDeliveryOrder";

export default interface IOrderRepository {

    findOne(id: string) : Promise<IOrder | null>;

    findAll(query: Partial<IOrderSearchQuery>) : Promise<Array<IOrder>>;

    delete(id: string, updatedById: string) : Promise<IOrder | null>;

    setPreparation(id: string, updateById: string, isReady: boolean) : Promise<IOrder>;

    setPreparationBatch(updateById: string, orders: {id: string, isReady: boolean}[]) : Promise<{order: IOrder | null, isReady: boolean}[]>

    changeSeller(orderId: string, userIdTo: string, updatedById: string) : Promise<IOrder | null>;

    applyDiscount(orderId: string, discount: number, updatedById: string) : Promise<IOrder | null>;

    getOrdersFromAccount(accountId: string) : Promise<Array<IOrder>>;

    finishOrdersOnCloseAccount(accountId: string) : Promise<void>;

    createOrder(data: IOrder): Promise<IOrder>

    updateId(id: string, storeCode: string) : Promise<void>;

    manageTipValue(storeCode: string, accountId: string, enabledTip: boolean) : Promise<void>;

    requestDeliveryOrder(order: IDeliveryOrder) : Promise<IDeliveryOrder>;

    getDeliveryOrderById(storeCode: string, id: string) : Promise<IDeliveryOrder>;

    getDeliveryOrders(storeCode: string, query: Partial<ISearchDeliveryOrder>) : Promise<IDeliveryOrderAggregated[]>;

    getDeliveryOrderByOrderId(orderId: string) : Promise<IDeliveryOrder | null>;

    updateDeliveryOrder(storeCode: string, id: string, data: Partial<IDeliveryOrder>) : Promise<IDeliveryOrder>;
}
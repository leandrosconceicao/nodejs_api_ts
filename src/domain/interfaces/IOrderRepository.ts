import { IOrder, IOrderSearchQuery } from "../../models/Orders";

export default interface IOrderRepository {

    findOne(id: string) : Promise<IOrder>;

    findAll(query: Partial<IOrderSearchQuery>) : Promise<Array<IOrder>>;

    delete(id: string, updatedById: string) : Promise<IOrder>;

    setPreparation(id: string, updateById: string, isReady: boolean) : Promise<IOrder>;

    changeSeller(orderId: string, userIdTo: string, updatedById: string) : Promise<IOrder>;

    applyDiscount(orderId: string, discount: number, updatedById: string) : Promise<IOrder>;

    getOrdersFromAccount(accountId: string) : Promise<Array<IOrder>>;

    finishOrdersOnCloseAccount(accountId: string) : Promise<void>;

    createOrder(data: IOrder): Promise<IOrder>

    updateId(id: string, storeCode: string) : Promise<void>;
}
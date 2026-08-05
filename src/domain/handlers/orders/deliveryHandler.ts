import { IOrder, Orders } from "../../../models/Orders";
import IOrderHandler from "../../interfaces/IOrderHandler";

export class DeliveryHandler implements IOrderHandler {
    constructor(
        private readonly order : IOrder
    ) {}

    create = async (): Promise<IOrder> => {
        let order = await Orders.create(this.order);
        order = await Orders.findById(order._id);

        return order;
    }


}
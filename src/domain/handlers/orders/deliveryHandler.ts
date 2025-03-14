import { IOrder, Orders } from "../../../models/Orders";
import IOrderHandler from "../../interfaces/IOrderHandler";

export class DeliveryHandler implements IOrderHandler {
    constructor(
        private readonly order : IOrder
    ) {}

    create = async (): Promise<IOrder> => {
        return Orders.create(this.order);
    }


}
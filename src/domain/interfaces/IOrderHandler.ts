import { IOrder } from "@/models/Orders";

export default interface IOrderHandler {

    create() : Promise<IOrder>;
}
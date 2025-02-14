
import { IOrder, Orders } from "../../../models/Orders";
import IOrderHandler from "../../interfaces/IOrderHandler";


export default class WithdrawHandler implements IOrderHandler {

    _order: IOrder

    constructor(data: IOrder) {
        this._order = data
    }
    create = async (): Promise<IOrder> => {

        const newOrder = await new Orders(this._order).save();
        return newOrder as IOrder;
    }
}
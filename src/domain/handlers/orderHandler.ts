import IOrderHandler from "../interfaces/IOrderHandler";
import FrontDeskHandler from "./orders/frontDeskHandler";
import AccountHandler from "./orders/accountHandler";
import WithdrawHandler from "./orders/withdrawHandler";
import { IOrder, OrderType } from "../../models/Orders";

export default class OrderHandler {

    static getInstance = (data: IOrder) : IOrderHandler => {
        switch (data.orderType) {
            case OrderType.frontdesk: 
                return new FrontDeskHandler(data);
            case OrderType.account:
                return new AccountHandler(data);
            case OrderType.withdraw:
                return new WithdrawHandler(data);
            default:
                throw new Error("Not Implemented")
        }
    }

}

import IOrderHandler from "../../../domain/interfaces/IOrderHandler";
import {Establishments} from "../../../models/Establishments";
import { z } from "zod";
import AccountsController from "../../../controllers/accounts/accountsController";
import ApiResponse from "../../../models/base/ApiResponse";
import { IOrder, IOrderProduct, Orders } from "../../../models/Orders";
import { idValidation } from "../../../utils/defaultValidations";

export default class AccountHandler implements IOrderHandler {

    _order: IOrder

    constructor(data: IOrder) {
        this._order = data
    }

    create = async (): Promise<IOrder> => {
        z.object({
            accountId: idValidation,
        }).parse(this._order);
        const accountCanReceivePay = await AccountsController.canReceiveNewOrder(this._order.accountId.toString())
        if (!accountCanReceivePay) {
            throw ApiResponse.badRequest("Conta não pode receber pedidos pois não está com o status de (ABERTA).");
        }
        await checkTipInvoicement(this._order.storeCode.toString(), this._order.products);
        const newOrder = await new Orders(this._order).save();
        return newOrder as IOrder;
    }

}

async function checkTipInvoicement(storeCode: string, products: IOrderProduct[]) {
    const store = await Establishments.findById(storeCode);
    if (!store) {
        return;
    }
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (product.hasTipValue) {
            product.tipValue = store.tipValue;
        }
    }
}

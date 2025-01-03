import IOrderHandler from "../../../domain/interfaces/IOrderHandler";
import { Orders, IOrder, orderValidation } from "../../../models/Orders";
import { CashRegister } from "../../../models/CashRegister";
import ApiResponse from "../../../models/base/ApiResponse";
import mongoose from "mongoose";
import { Payments } from "../../../models/Payments";
import { z } from "zod";
import { Users } from "../../../models/Users";
import { PaymentMethods } from "../../../models/PaymentMethods";
import { idValidation } from "../../../utils/defaultValidations";

var ObjectId = mongoose.Types.ObjectId;

export default class FrontDeskHandler implements IOrderHandler {

    _order: IOrder

    constructor(data: IOrder) {
        this._order = data
    }

    create = async () : Promise<IOrder> => {

        z.object({
            createdBy: idValidation,
            paymentMethod: idValidation,
        }).parse(this._order);

        const openCash = await getOpenCashRegister(`${this._order.createdBy}`)
        
        if (!openCash) {
            throw ApiResponse.forbidden("Usuário não possui caixa aberto")
        }

        const method = await PaymentMethods.findById(this._order.paymentMethod);

        if (!method) {
            throw ApiResponse.badRequest("Forma de pagamento inválida ou não localizada");
        }

        const newOrder = await new Orders(this._order).save();
        
        const subTotal = newOrder.subTotal;

        const payment = new Payments({
            storeCode: newOrder.storeCode,
            cashRegisterId: openCash._id,
            userCreate: newOrder.createdBy,
            orderId: newOrder._id,
            method: newOrder.paymentMethod,
            total: subTotal
        });

        try {
            await payment.validate();
            await payment.save();
        } catch (e) {
            await Orders.findByIdAndDelete(newOrder._id);
            throw e;
        }

        return newOrder;
    }
}

async function getOpenCashRegister(created_by: string) {
    const cashRegisters = await CashRegister.findOne({
        created_by: new ObjectId(created_by),
        status: 'open'
    });
    return cashRegisters;
}
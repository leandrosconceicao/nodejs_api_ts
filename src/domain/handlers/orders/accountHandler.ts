
import IOrderHandler from "../../../domain/interfaces/IOrderHandler";
import { z } from "zod";
import { IOrder, IOrderProduct, Orders } from "../../../models/Orders";
import { idValidation } from "../../../utils/defaultValidations";
import { inject } from "tsyringe";
import IAccountRepository from "../../interfaces/IAccountRepository";
import BadRequestError from "../../../models/errors/BadRequest";
import IEstablishmentRepository from "../../interfaces/IEstablishmentRepository";

export default class AccountHandler implements IOrderHandler {

    _order: IOrder

    constructor(
        data: IOrder,
        @inject('IAccountRepository') private readonly accountRepository: IAccountRepository,
        @inject('IEstablishmentRepository') private readonly establishmentRepository : IEstablishmentRepository
    ) {
        this._order = data
    }

    create = async (): Promise<IOrder> => {
        z.object({
            accountId: idValidation,
        }).parse(this._order);
        const accountCanReceivePay = await this.accountRepository.accountIsOpen(this._order.accountId.toString())
        if (!accountCanReceivePay) 
            throw new BadRequestError("Conta não pode receber pedidos pois não está com o status de (ABERTA).");
        
        await this.checkTipInvoicement(this._order.storeCode.toString(), this._order.products);
        const newOrder = await new Orders(this._order).save();
        return newOrder as IOrder;
    }

    checkTipInvoicement = async (storeCode: string, products: IOrderProduct[]) => {
        const store = await this.establishmentRepository.findOne(storeCode);
        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            if (product.hasTipValue) {
                product.tipValue = store.tipValue;
            }
        }
    }
}


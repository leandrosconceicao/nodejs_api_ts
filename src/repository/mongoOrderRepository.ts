import { delay, inject, injectable, registry } from "tsyringe";
import IOrderRepository from "../domain/interfaces/IOrderRepository";
import { IOrder, IOrderSearchQuery, Orders, OrderType } from "../models/Orders";
import NotFoundError from "../models/errors/NotFound";
import mongoose from "mongoose";
import { Users } from "../models/Users";
import ForbiddenAcessError from "../domain/exceptions/ForbiddenAcessError";
import IEstablishmentRepository from "../domain/interfaces/IEstablishmentRepository";
import AccountHandler from "../domain/handlers/orders/accountHandler";
import FrontDeskHandler from "../domain/handlers/orders/frontDeskHandler";
import WithdrawHandler from "../domain/handlers/orders/withdrawHandler";
import IOrderHandler from "../domain/interfaces/IOrderHandler";
import Counters from "../models/Counters";
import BadRequestError from "../models/errors/BadRequest";
import IAccountRepository from "../domain/interfaces/IAccountRepository";

var ObjectId = mongoose.Types.ObjectId;

const populateClient = "client";
const popuAccId = "accountDetail";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";

@injectable()
@registry([
    {
        token: `IOrderRepository`,
        useToken: delay(() => MongoOrderRepository)
    }
])
export default class MongoOrderRepository implements IOrderRepository {

    constructor(
        @inject("IAccountRepository") private readonly accountRepository : IAccountRepository,
        @inject('IEstablishmentRepository') private readonly establishmentRepository: IEstablishmentRepository
    ) {}

    async setPreparationBatch(updateById: string, orders: { id: string; isReady: boolean; }[]): Promise<{order: IOrder, isReady: boolean}[]> {
        const updatedOrders = await Promise.all(
            orders.map((e) => Orders.findByIdAndUpdate(e.id, {
                status: e.isReady ? "finished": "pending",
                "products.$[].setupIsFinished": e.isReady,
                updated_by: new ObjectId(updateById)
            }, {
                new: true
            })
            .populate(populateClient)
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]))
        )

        return updatedOrders.map((order) => {
            return {
                order: order,
                isReady: orders.find((e) => e.id === order._id.toString()).isReady
            }
        });
    }

    async manageTipValue(storeCode: string, accountId: string, enabledTip: boolean): Promise<void> {

        const store = await this.establishmentRepository.findOne(storeCode);

        const updateResult = await Orders.updateMany({
            accountId: accountId,
            storeCode: storeCode
        }, {
            $set: {
                "products.$[].tipValue": enabledTip ? store.tipValue : 0
            }
        });

        if (!updateResult.modifiedCount) {
            throw new BadRequestError('Nenhum dado atualizado, verifique os filtros informados')
        }
    }

    async createOrder(data: IOrder): Promise<IOrder> {

        let handler = this.getInstance(data);

        return handler.create();
    }

    async setPreparation(id: string, updateById: string, isReady: boolean): Promise<IOrder> {
        await Orders.findByIdAndUpdate(id, {
            status: isReady ? "finished": "pending",
            "products.$[].setupIsFinished": isReady,
            updated_by: new ObjectId(updateById)
        }, {
            new: true
        })
        .populate(populateClient)
        .populate(popuAccId, [popuPayment, popuOrders])
        .populate(popuUser, [popuEstablish, popuPass]).lean();

        return this.findOne(id)
    }

    delete(id: string, updatedById: string): Promise<IOrder> {
        return Orders.findByIdAndUpdate(id, {
            status: "cancelled",
            updated_by: new ObjectId(updatedById)
        }, {
            returnDocument: "after"
        });
    }

    findAll(query: Partial<IOrderSearchQuery>): Promise<Array<IOrder>> {

        return Orders.find(query)
    }

    async findOne(id: string): Promise<IOrder> {

        const order = await Orders.findById(id)
            .populate("storeCodeDetail", ["-ownerId"])
            .populate("paymentMethodDetail")
            .populate("paymentDetail")
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]);

        if (!order) {
            throw new NotFoundError("Pedido não localizado");
        }

        return order;
    }

    async changeSeller(orderId : string, userIdTo: string, updatedById: string): Promise<IOrder> {
        const userTo = await Users.findById(userIdTo);
        if (!userTo) {
            throw new NotFoundError("Vendedor de destino não existe ou não foi localizado");
        }
        if (!userTo.isActive) {
            throw new ForbiddenAcessError("Vendedor de destino não está ativo")
        }
        return Orders.findByIdAndUpdate(orderId, {
            createdBy: new ObjectId(userIdTo),
            updated_by: new ObjectId(updatedById)
        });
    }

    async applyDiscount(orderId: string, discount: number, updatedById: string) {

        const order = await this.findOne(orderId);

        if (!order)
            throw new NotFoundError("Pedido não localizado");

        await this.establishmentRepository.validateDiscount(order.storeCode.toString(), discount);
        
        if (discount > 0) {
            discount = discount / 100
        }

        return Orders.findOneAndUpdate({
            _id: new ObjectId(orderId),
            status: "pending"
        }, {
            discount: discount,
            updatedBy: updatedById,
        }, {
            new: true
        });
    }

    getOrdersFromAccount(accountId: string): Promise<Array<IOrder>> {
        return Orders.find({
            accountId: new ObjectId(accountId),
            status: {$ne: "cancelled"}
        })
        .populate(populateClient)
        .populate(popuAccId, [popuPayment, popuOrders])
        .populate(popuUser, [popuEstablish, popuPass]);
    }

    async finishOrdersOnCloseAccount(accountId: string): Promise<void> {
        await Orders.updateMany({
            accoundId: new ObjectId(accountId)
        }, {
            $set: {
                status: "finished",
                "products.$[].setupIsFinished": true,
                updated_at: new Date()
            }
        })
    }

    private getInstance = (data: IOrder) : IOrderHandler => {
        switch (data.orderType) {
            case OrderType.frontdesk: 
                return new FrontDeskHandler(data);
            case OrderType.account:
                return new AccountHandler(data, this.accountRepository, this.establishmentRepository);
            case OrderType.withdraw:
                return new WithdrawHandler(data);
            default:
                throw new Error("Not Implemented")
        }
    }

    async updateId(id: string, storeCode: string) {
        let count = 0;
        let counter = await Counters.findOne({
            storeCode: new ObjectId(storeCode)
        });
        if (!counter) {
            count += 1;
        } else {
            const value = counter;
            const now = new Date();
            if (value.createDate.toLocaleDateString() !== now.toLocaleDateString()) {
                count += 1;
            } else {
                count = value.seq_value + 1;
            }
        }
        await Promise.all([
            Orders.findByIdAndUpdate(id, {
                pedidosId: count
            }),
            Counters.updateMany({
                storeCode: new ObjectId(storeCode)
            }, {
                seq_value: count, createDate: new Date()
            }, {
                upsert: true
            })
        ]);
    }
}
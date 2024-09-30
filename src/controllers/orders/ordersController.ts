import mongoose from "mongoose";
import {z} from "zod";
import { idValidation } from "../../utils/defaultValidations";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery";
import { Request, Response, NextFunction } from "express";
import { Validators } from "../../utils/validators";
import { Orders, orderSchema, orderValidation } from "../../models/Orders";
import ApiResponse from "../../models/base/ApiResponse";
import {Users} from "../../models/Users";
import { updateUserToken } from "../users/userController.js";
import Counters from "../../models/Counters";
import NotFoundError from "../../models/errors/NotFound";
import {Accounts} from "../../models/Accounts";
import {Establishments} from "../../models/Establishments";
import InvalidParameter from "../../models/errors/InvalidParameters";
import PaymentController from "../payments/paymentController";
import AccountsController from "../accounts/accountsController";
import { Payments } from "../../models/Payments";
import LogsController from "../logs/logsController";
import EstablishmentsController from "../establishments/establishmentController";
import FirebaseMessaging from "../../utils/firebase/messaging";
import { getOpenCashRegister } from "../payments/cashRegisterController.js";

var ObjectId = mongoose.Types.ObjectId;

const logControl = new LogsController();

const FBMESSAGING = new FirebaseMessaging();

const populateClient = "client";
const popuAccId = "accountId";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";

interface OrderSearchQuery {
    isPreparation?: boolean,
    type?: string,
    createDate: DateQuery,
    clientId?: any,
    payment?: any,
    accountId?: any,
    status?: any,
    userCreate?: any,
    accepted?: boolean,
    storeCode: any,
    products?: any,
    _id?: any
}
export default class OrdersController {


    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const idVal = new Validators("id", id).validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            const order = await Orders.findById(id)
                .populate(populateClient)
                .populate(popuAccId, [popuPayment, popuOrders])
                .populate(popuUser, [popuEstablish, popuPass]);
            if (!order) {
                throw new NotFoundError("Pedido não localizado");
            }
            return ApiResponse.success(order).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const {
                isPreparation,
                type,
                from,
                to,
                id,
                clientId,
                paymentId,
                accountId,
                status,
                userCreate,
                accepted,
                storeCode,
            } = req.query;
            const storeVal = new Validators("storeCode", storeCode, "string").validate();
            const fromVal = new Validators("from", from, "string").validate();
            const toVal = new Validators("to", to, "string").validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            if (!fromVal.isValid) {
                throw new InvalidParameter(fromVal);
            }
            if (!toVal.isValid) {
                throw new InvalidParameter(toVal);
            }
            const query: OrderSearchQuery = {
                storeCode: new ObjectId(storeCode as string),
                createDate: new PeriodQuery(from as string, to as string).build(),
            }
            if (type) {
                query.type = type as string;
            }
            if (isPreparation) {
                query.products = {
                    $elemMatch: { setupIsFinished: false, needsPreparation: true },
                };
                query.status = {
                    $nin: ["cancelled", "finished"]
                }
            }
            if (id) {
                query._id = new ObjectId(id as string);
            }
            if (clientId) {
                query.clientId = {
                    _id: new ObjectId(id as string)
                };
            }
            if (accountId) {
                query.accountId = new ObjectId(accountId as string);
            }
            if (userCreate) {
                query.userCreate = new ObjectId(userCreate as string);
            }
            if (accepted) {
                query.accepted = accepted === "true";
            }
            if (status && !isPreparation) {
                query.status = status;
            }
            if (paymentId) {
                query.payment = new ObjectId(paymentId as string);
            }
            req.result = Orders.find(query)
                .populate(populateClient)
                .populate(popuAccId, [popuPayment, popuOrders])
                .populate(popuUser, [popuEstablish, popuPass])
            next();
        } catch (e) {
            next(e);
        }
    }

    static async cancelOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const {id, userCode} : {id: string, userCode: string} = req.body;
            const idVal = new Validators("id", id, "string").validate();
            const updatedVal = new Validators("userCode", userCode, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            if (!updatedVal.isValid) {
                throw new InvalidParameter(updatedVal);
            }
            const process = await Orders.findByIdAndUpdate(id, {
                status: "cancelled",
                isPayed: false,
                updated_at: new Date(),
                updated_by: new ObjectId(userCode)
            }, {
                returnDocument: "after"
            });
            await Payments.findByIdAndDelete(process.payment);
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async transfer(req: Request, res: Response, next: NextFunction) {
        try {
            const {orderIds, originId, destinationId, userCode}: {
                orderIds: Array<string>,
                originId: string,
                destinationId: string,
                userCode: string
            } = req.body;
            if (!orderIds.length) {
                throw ApiResponse.badRequest("Ids dos pedidos são inválidos ou não foram informados");
            }
            const originIdVal = new Validators("originId", originId).validate();
            const destinationIdVal = new Validators("destinationId", destinationId).validate();
            const userVal = new Validators("userCode", userCode).validate();
            if (!originIdVal.isValid) {
                throw new InvalidParameter(originIdVal);
            }
            if (!destinationIdVal.isValid) {
                throw new InvalidParameter(destinationIdVal);
            }
            if (!userVal.isValid) {
                throw new InvalidParameter(userVal);
            }
            const originAcc = await Accounts.findById(originId).lean();
            const destiAcc = await Accounts.findById(destinationId).lean();
            if (originAcc.status !== "open") {
                throw ApiResponse.badRequest("Conta de origem não está aberta");
            }
            if (destiAcc.status !== "open") {
                throw ApiResponse.badRequest("Conta de destino não está aberta");
            }
            const process = await Orders.updateMany({
                _id: {
                    $in: orderIds.map((e) => new ObjectId(e))
                }
            }, {
                $set: {
                    accountId: new ObjectId(destinationId),
                    updated_at: new Date(),
                    updated_by: new ObjectId(userCode)
                }
            });
            if (!process.modifiedCount) {
                throw ApiResponse.badRequest("Nenhum dado modificado, pedidos informados não foram localizados");
            }
            logControl.saveReqLog(
                req, 
                null,
                {
                  orderId: new ObjectId(originAcc._id),
                  description: `Transferência de pedidos da conta (${originAcc.description}) para a conta (${destiAcc.description})`,
                  storeCode: new ObjectId(originAcc.storeCode),
                  userCreate: new ObjectId(userCode)
                }
              );
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async pushNewItems(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const {orders} : {orders: Array<any>} = req.body;
            const orderVal = new Validators("orders", orders, "array").validate();
            if (!orderVal.isValid) {
                throw new InvalidParameter(orderVal);
            }
            if (!orders.length) {
                throw ApiResponse.badRequest("Nenhum pedido foi informado");
            }
            const process = await Orders.findByIdAndUpdate(id, {
                $push: {products: orders}
            }, {new: true});
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
    
    static async pullItem(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const {item_id} : {item_id: string} = req.body;
            const itemval = new Validators("item_id", item_id, "string").validate();
            const idVal = new Validators("id", id, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            if (!itemval.isValid) {
                throw new InvalidParameter(itemval);
            }
            const process = await Orders.findByIdAndUpdate(id, {
                $pull: {products: {_id: item_id}}
            }, {new: true});
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async changeSeller(req: Request, res: Response, next: NextFunction) {
        try {
            const {userTo, userCode} : {userTo: string, userCode: string} = req.body;
            const id = req.params.id;
            const idVal = new Validators("id", id, "string").validate();
            const userToVal = new Validators("userTo", userTo, "string").validate();
            const updatedVal = new Validators("userCode", userCode, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            if (!idVal.isValid) {
                throw new InvalidParameter(userToVal);
            }
            if (!updatedVal.isValid) {
                throw new InvalidParameter(updatedVal);
            }
            const process = await Orders.findByIdAndUpdate(id, {
                userCreate: userTo,
                updated_at: new Date(),
                updated_by: new ObjectId(userCode)
            }, {
                new: true
            })
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
        
    static async setPreparation(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const body = z.object({
                isReady: z.boolean(),
                userCode: idValidation,
            }).parse(req.body)
            const process = await Orders.findByIdAndUpdate(id, {
                status: body.isReady ? "finished": "pending",
                "products.$[].setupIsFinished": body.isReady,
                updated_at: new Date(),
                updated_by: new ObjectId(body.userCode)
            }, {
                new: true
            })
            .populate(populateClient)
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]).lean();
            
            notififyUser(process.userCreate, "Preparação de pedido", body.isReady ? `Atenção, pedido: ${process.pedidosId} está pronto` : "Alerta de pedido");

            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async newOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const token = z.string().optional().parse(req.headers.firebasetoken);
            const data = orderValidation.parse(req.body);
            const newOrder = new Orders(data);
            await EstablishmentsController.checkOpening(newOrder.storeCode, newOrder.orderType);
            const openCashes = await getOpenCashRegister(data.userCreate)
            if (!data.accountId && !openCashes) {
                throw ApiResponse.badRequest("Usuário não possui caixa aberto")
            }
            if (data.orderType && data.orderType === "frontDesk") { 
                data.payment.cashRegisterId = openCashes._id.toString();
                const pay = await PaymentController.savePayment(data.payment);
                newOrder.payment = pay._id as any;
            }
            if (data.accountId) {
                const canRecieveNewOrder = await AccountsController.canReceiveNewOrder(data.accountId);
                if (!canRecieveNewOrder) {
                    throw ApiResponse.badRequest("Conta não pode receber pedidos pois não está com o status de (ABERTA).");
                }
                
            }
            if (token) {
                updateUserToken(data.userCreate, token);
            }
            const process = await newOrder.save();
            await updateId(process._id.toString(), data.storeCode);
            const updatedOrder = await Orders.findById(process._id)
                .populate(populateClient)
                .populate(popuAccId, [popuPayment, popuOrders])
                .populate(popuUser, [popuEstablish, popuPass]);
            return ApiResponse.success(updatedOrder).send(res);
        } catch (e) {
            next(e);
        }
    }



    static async getOrdersFromAccount(accountId: string) {
        const data = await Orders.find({
            accountId: new ObjectId(accountId),
            status: { $ne: "cancelled" }
        })
            .populate(populateClient)
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]);
        return data;
    }

    static async finishOrdersOnCloseAccount(accountId: string) {
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
    
    static async getOrdersOnPreparation(req: Request, res: Response, next: NextFunction) {
        try {
            const storeCode = idValidation.parse(req.params.id);
            const dates = z.object({
                from: z.string().datetime({offset: true}),
                to: z.string().datetime({offset: true})
            }).parse(req.query);
            let orders = await ordersOnPreparation(storeCode, dates.from, dates.to);
            return ApiResponse.success(orders).send(res);
        } catch (e) {
            next(e);
        }
    }
}

async function ordersOnPreparation(storeCode: string, from: string, to: string) {
    return Orders.find({
        status: {
            $ne: "cancelled"
        },
        storeCode: storeCode,
        createDate: new PeriodQuery(
            from,
            to
        ).build(),
        products: {
            $elemMatch: { setupIsFinished: false, needsPreparation: true },
        }
    }).sort({
        ["createDate"]: 1
    }).populate(populateClient)
    .populate(popuAccId, [popuPayment, popuOrders])
    .populate(popuUser, [popuEstablish, popuPass]);
}

async function updateId(id: string, storeCode: string) {
    let count = 0;
    let counter = await Counters.find({
        storeCode: new ObjectId(storeCode)
    });
    if (!counter.length) {
        count += 1;
    } else {
        const value = counter[0];
        const now = new Date();
        if (value.createDate.toLocaleDateString() !== now.toLocaleDateString()) {
            count += 1;
        } else {
            count = value.seq_value + 1;
        }
    }
    await Orders.findByIdAndUpdate(id, {
        pedidosId: count
    });
    await Counters.updateMany({
        storeCode: new ObjectId(storeCode)
    }, {
        seq_value: count, createDate: new Date()
    }, {
        upsert: true
    })
}

async function notififyUser(userData: any, title: string, body: string) {
    const user = await Users.findById(userData._id);
    if (user) {
        FBMESSAGING.sendToUser(user.token, {
            title,
            body
        });
    }
}
import mongoose from "mongoose";
import {z} from "zod";
import { idValidation } from "../../utils/defaultValidations";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery";
import { Request, Response, NextFunction } from "express";
import { Validators } from "../../utils/validators";
import { orderProductValidation, Orders, OrderStatus, OrderType, orderValidation } from "../../models/Orders";
import ApiResponse from "../../models/base/ApiResponse";
import {Users} from "../../models/Users";
import Counters from "../../models/Counters";
import NotFoundError from "../../models/errors/NotFound";
import {Accounts} from "../../models/Accounts";
import {Establishments} from "../../models/Establishments";
import InvalidParameter from "../../models/errors/InvalidParameters";
import { Payments } from "../../models/Payments";
import LogsController from "../logs/logsController";
import EstablishmentsController from "../establishments/establishmentController";
import FirebaseMessaging from "../../utils/firebase/messaging";
import MongoId from "../../models/custom_types/mongoose_types";
import OrderHandler from "../../domain/handlers/orderHandler";

var ObjectId = mongoose.Types.ObjectId;

const logControl = new LogsController();

const FBMESSAGING = new FirebaseMessaging();

const populateClient = "client";
const popuAccId = "accountDetail";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";

interface IOrderSearchQuery {
    isPreparation?: boolean,
    type?: string,
    createdAt: DateQuery,
    // clientId?: any,
    // payment?: any,
    accountId?: any,
    status?: string | object,
    createdBy?: any,
    accepted?: boolean,
    storeCode: any,
    products?: any,
    _id?: any
}
export default class OrdersController {


    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);

            const order = await Orders.findById(id)
                .populate("storeCodeDetail", ["-ownerId"])
                .populate("paymentMethodDetail")
                .populate("paymentDetail")
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
            const today = new Date();
            const optionalTo = `${new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()}`;
            const query: Partial<IOrderSearchQuery> = {};
            z.object({
                from: z.string().datetime({offset: true}),
                to: z.string().datetime({offset: true}).default(optionalTo),
                id: idValidation.optional(),
                status: z.nativeEnum(OrderStatus).optional(),
                storeCode: idValidation,
                isPreparation: z.boolean().optional(),
                type: z.nativeEnum(OrderType).optional(),
                accountId: idValidation.optional(),
                createdBy: idValidation.optional(),
            }).transform((val) => {
                query.storeCode = new ObjectId(val.storeCode);

                query.createdAt = new PeriodQuery(val.from, val.to).build();

                if (val.type) {
                    query.type = val.type;
                }

                if (val.id) {
                    query._id = new ObjectId(val.id);
                }

                if (val.accountId) {
                    query.accountId = new ObjectId(val.accountId);
                }

                if (val.createdBy) {
                    query.createdBy = new ObjectId(val.createdBy);
                }

                if (val.status) {
                    query.status = val.status;
                }

                if (val.isPreparation) {

                    query.products = {
                        $elemMatch: { setupIsFinished: false, needsPreparation: true },
                    };
                    query.status = {
                        $nin: ["cancelled", "finished"]
                    }

                }


            }).parse(req.query);
            
            req.result = Orders.find(query)
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
            await Payments.findOneAndDelete({
                orderId: process._id
            });
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
            const id = idValidation.parse(req.params.id);
            const data = z.object({
                orders: z.array(orderProductValidation).nonempty({message: "Lista de produtos não pode ser vazia"})
            }).parse(req.body);
            const process = await Orders.findByIdAndUpdate(id, {
                $push: {products: data.orders}
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
            
            if (process?.storeCode) {
                notififyUser(process.storeCode, "Preparação de pedido", body.isReady ? `Atenção, pedido: ${process.pedidosId} está pronto` : "Alerta de pedido");
            }

            req.result = {
                isReady: body.isReady,
                order: process
            };
            next();
        } catch (e) {
            next(e);
        }
    }

    static async newOrder(req: Request, res: Response, next: NextFunction) {
        try {
            // const token = z.string().optional().parse(req.headers.firebasetoken);
            const rawData = orderValidation.parse(req.body);

            await EstablishmentsController.checkOpening(rawData.storeCode, rawData.orderType)

            const handler = OrderHandler.getInstance(req.body)

            const order = await handler.create();
            await updateId(order._id.toString(),  order.storeCode.toString());
            const updatedOrder = await Orders.findById(order._id)
                // .populate(populateClient)
                .populate(popuAccId, [popuPayment, popuOrders])
                .populate(popuUser, [popuEstablish, popuPass]);
            req.result = updatedOrder;
            next();
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
            req.result = storeCode;
            next();
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

async function notififyUser(userData: string | MongoId, title: string, body: string) {
    const user = await Users.findById(userData);
    if (user?.token) {
        FBMESSAGING.sendToUser(user.token, {
            title,
            body
        });
    }
}

async function checkTipInvoicement(storeCode: string, products: z.infer<typeof orderProductValidation>[]) {
    const store = await Establishments.findById(storeCode);
    if (!store) {
        return;
    }
    for (let i = 0; i < products.length; i++) {
        const product = products[i];
        if (product.hasTipValue) 
            product.tipValue = store.tipValue;
    }
}

import mongoose from "mongoose";
import {z} from "zod";
import { booleanStringValidation, idValidation } from "../../utils/defaultValidations";
import { PeriodQuery } from "../../utils/PeriodQuery";
import { Request, Response, NextFunction } from "express";
import { Validators } from "../../utils/validators";
import { IOrder, IOrderSearchQuery, Orders, OrderStatus, OrderType, orderValidation } from "../../models/Orders";
import ApiResponse from "../../models/base/ApiResponse";
import {Accounts} from "../../models/Accounts";
import InvalidParameter from "../../models/errors/InvalidParameters";
import LogsController from "../logs/logsController";
import { autoInjectable, inject } from "tsyringe";
import IEstablishmentRepository from "../../domain/interfaces/IEstablishmentRepository";
import IOrderRepository from "../../domain/interfaces/IOrderRepository";
import ICloudService from "../../domain/interfaces/ICloudService";
import IUserRepository from "../../domain/interfaces/IUserRepository";
import { deliveryOrdersSearchValidation, deliveryOrdersUpdateValidation, deliveryOrdersValidation, IDeliveryOrder, ISearchDeliveryOrder } from "../../domain/types/IDeliveryOrder";

export var ObjectId = mongoose.Types.ObjectId;

const logControl = new LogsController();

const populateClient = "client";
const popuAccId = "accountDetail";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";

@autoInjectable()
export default class OrdersController {

    constructor(
        @inject("IEstablishmentRepository") private readonly establishmentRepository: IEstablishmentRepository,
        @inject("IOrderRepository") private readonly orderRepository: IOrderRepository,
        @inject("ICloudService") private readonly cloudService: ICloudService,
        @inject("IUserRepository") private readonly userRepository: IUserRepository
    ) {}


    findOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const order = await this.orderRepository.findOne(id);

            return ApiResponse.success(order).send(res);
        } catch (e) {
            next(e);
        }
    }

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const today = new Date();
            const optionalTo = `${new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString()}`;
            const query: Partial<IOrderSearchQuery> = {};
            z.object({
                from: z.string().datetime({offset: true}),
                to: z.string().datetime({offset: true}).default(optionalTo),
                id: idValidation.optional(),
                status: z.nativeEnum(OrderStatus).or(z.array(z.nativeEnum(OrderStatus))).optional(),
                storeCode: idValidation,
                excludeStatus: booleanStringValidation.optional(),
                isPreparation: z.boolean().optional(),
                type: z.nativeEnum(OrderType).or(z.array(z.nativeEnum(OrderType))).optional(),
                accountId: idValidation.optional(),
                createdBy: idValidation.optional(),
            }).transform((val) => {
                query.storeCode = new ObjectId(val.storeCode);

                query.createdAt = new PeriodQuery(val.from, val.to).build();

                if (val.type) {
                    query.orderType = {
                        $in: typeof val.type === "object" ? [...val.type] : [val.type]
                    };
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
                    query.status = val.excludeStatus ? {
                        $nin: typeof val.status === "object" ? [...val.status] : [val.status]
                    } : {
                        $in: typeof val.status === "object" ? [...val.status] : [val.status]
                    };
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
            
            req.result = this.orderRepository.findAll(query);
            next();
        } catch (e) {
            next(e);
        }
    }

    cancelOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const process = await this.orderRepository.delete(id, req.autenticatedUser.id);
            
            req.result = process;
            
            next();
        } catch (e) {
            next(e);
        }
    }

    changeSeller = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);
            
            const body = z.object({
                userTo: idValidation
            }).parse(req.body);

            const process = await this.orderRepository.changeSeller(id, body.userTo, req.autenticatedUser.id);

            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
        
    setPreparation = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);
            const body = z.object({
                isReady: z.boolean(),
                userCode: idValidation,
            }).parse(req.body)

            const process = await this.orderRepository.setPreparation(id, body.userCode, body.isReady);
            
            if (process?.createdBy) {
                await this.notifyUsers(process, body.isReady)
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

    newOrder = async (req: Request, res: Response, next: NextFunction)  => {
        try {
            const rawData = orderValidation.parse(req.body);

            await this.establishmentRepository.checkOpening(rawData.storeCode, rawData.orderType)        

            await this.establishmentRepository.validateDiscount(rawData.storeCode.toString(), rawData.discount);            

            const order = await this.orderRepository.createOrder(rawData as IOrder);

            await this.orderRepository.updateId(order._id.toString(),  order.storeCode.toString());

            const updatedOrder = await this.orderRepository.findOne(`${order._id}`)

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

    applyOrderDiscount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const orderId = idValidation.parse(req.params.id)

            const body = z.object({
                discount: z.number().nonnegative({
                    message: "Informe um valor entre 0 e 100"
                })
            }).parse(req.body);

            const updateOrder = await this.orderRepository.applyDiscount(orderId, body.discount, req.autenticatedUser.id);            

            ApiResponse.success(updateOrder).send(res);

        } catch (e) {
            next(e);
        }
    }

    setPreparationBatch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = z.array(z.object({
                isReady: z.boolean(),
                id: idValidation
            }))
            .transform((value) => {
                return value.map((e) => <{isReady: boolean, id: string}>{
                    id: e.id,
                    isReady: e.isReady
                })
            })
            .parse(req.body)

            const orders = await this.orderRepository.setPreparationBatch(req.autenticatedUser.id, body)

            await Promise.all(
                orders.map((e) => this.notifyUsers(e.order, e.isReady))
            )

            req.result = orders;

            next();

        } catch (e) {
            next(e);
        }
    }

    requestDeliveryOrders = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = {
                storeCode: req.params.storeCode,
                ...req.body
            }
            const data = deliveryOrdersValidation.parse(body);

            const orderRequest = await this.orderRepository.requestDeliveryOrder(data as IDeliveryOrder);

            ApiResponse.success(orderRequest, 201).send(res);

        } catch (e) {
            next(e);
        }
    }
    
    findAllDeliveryOrders = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const data = deliveryOrdersSearchValidation.parse(req.query);
    
            const orderRequest = await this.orderRepository.getDeliveryOrders(data);
    
            ApiResponse.success(orderRequest).send(res);
    
        } catch (e) {
            next(e);
        }
    }
    
    findDeliveryOrderById = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const id = idValidation.parse(req.params.id);
    
            const orderRequest = await this.orderRepository.getDeliveryOrderById(id)
    
            ApiResponse.success(orderRequest).send(res);
    
        } catch (e) {
            next(e);
        }
        
    }

    updateDeliveryOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            
            const id = idValidation.parse(req.params.id);

            const body = deliveryOrdersUpdateValidation.parse(req.body);

            const updatedOrder = await this.orderRepository.updateDeliveryOrder(id, body);

            req.result = updatedOrder;

            next();

        } catch (e) {
            next(e);
        }
    }

    cancelDeliveryOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = req.params.id;
            

        } catch (e) {
            next(e);
        }
    }

    private async notifyUsers(process: IOrder, isReady: boolean) : Promise<void> {
        const user = await this.userRepository.findOne(process.createdBy.toString());
        if (user?.token) {
            let info;
            if (process.orderType == OrderType.account) {
                info = `conta: ${process?.accountDetail?.description}`;
            } else {
                info = process?.client?.name ? `cliente: ${process?.client?.name}` : 'cliente não informado'
            }
            info += `${isReady ? '' : ', status de preparação foi revertido, verique com o balcão o status do pedido'}`;
            this.cloudService.notifyUsers(user?.token?.toString(), "Preparação de pedido", `Atenção, pedido: ${process.pedidosId} ${isReady ? 'está pronto' : 'não está pronto'}, ${info}`);
        }
    }

    checkPreparationOrders = async (req: Request, res: Response, next: NextFunction) => {
        try {                      

            const companies = await this.establishmentRepository.findAll();

            await Promise.all(companies.map((e) => this.cloudService.checkPreparationOrders(e._id.toString())));
            
            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }
}

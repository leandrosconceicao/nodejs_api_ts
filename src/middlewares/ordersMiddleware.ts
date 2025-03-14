import {Request, Response, NextFunction} from "express";
import { IOrder, OrderStatus, OrderType} from "../models/Orders";
import ErrorAlerts from "../utils/errorAlerts";
import { autoInjectable, inject } from "tsyringe";
import ICloudService from "../domain/interfaces/ICloudService";
import ApiResponse from "../models/base/ApiResponse";
import { IDeliveryOrder } from "../domain/types/IDeliveryOrder";
import IOrderRepository from "../domain/interfaces/IOrderRepository";

@autoInjectable()
export class OrdersMiddleware {

    constructor(
        @inject("ICloudService") private readonly cloudService : ICloudService,
        @inject("IOrderRepository") private readonly orderRepository: IOrderRepository,
    ) {}
    
    updateWithDrawMonitorBatch = (req: Request, _: Response, next: NextFunction) => {
        try {
            const data : Array<{
                isReady: boolean,
                order: IOrder
            }> = req.result;
            
            Promise.all(data.map((e) => this.cloudService.addWithdrawOrder(e.order)))
    
        } catch (e) {
            ErrorAlerts.sendAlert(e, req);
        }
        next();
    }

    updateWithDrawMonitor = (req: Request, _: Response, next: NextFunction) => {
        try {
            const data : {
                isReady: boolean,
                order: IOrder
            } = req.result
    
            this.cloudService.updateWithdrawOrder(data.order);
            
        } catch (e) {
            ErrorAlerts.sendAlert(e, req);
        }
        next();
    }

    removePreparation = (req: Request, _: Response, next: NextFunction) => {
        const order = req.result as IOrder;
        try {

            this.cloudService.removePreparationOrder(order);

        } catch (e) {
            ErrorAlerts.sendAlert(e, req);
        }
        next();
    }

    manageWithDrawMonitor = (req: Request, _: Response, next: NextFunction) => {
        try {
            const order : IOrder = req.result;
            
            this.cloudService.addWithdrawOrder(order);

        } catch (e) {
            ErrorAlerts.sendAlert(e, req);
        }
        next();
    }

    addPreparationOrder = (req: Request, _: Response, next: NextFunction) => {
        try {
            const order : IOrder = req.result;

            this.cloudService.addPreparationOrder(order);

        } catch (e) {
            ErrorAlerts.sendAlert(e, req);
        }
        next();
    }

    setOrderOnPreparation = (req: Request, res: Response, _: NextFunction) => {
        const data : {
            isReady: boolean,
            order: IOrder
        } = req.result
        try {
            if (data.isReady) {

                this.cloudService.removePreparationOrder(data.order);

                this.cloudService.notifyUsers(data.order.firebaseToken, "Alerta de pedido", "pedido está pronto")
                
            } else {
                this.cloudService.addPreparationOrder(data.order)
            }
        } catch (e) {
            ErrorAlerts.sendAlert(e, req);
        }
        ApiResponse.success(data.order).send(res);
    }

    manageDeliveryOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            
            let deliveryOrder : IDeliveryOrder = req.result;

            if (deliveryOrder.status === OrderStatus.accepted) {
                
                let order: Partial<IOrder> = {
                    client: deliveryOrder.client,
                    orderType: OrderType.delivery,
                    paymentMethod: deliveryOrder.paymentMethod,
                    products: deliveryOrder.products,
                    storeCode: deliveryOrder.storeCode,
                }

                order = await this.orderRepository.createOrder(order as IOrder)

                deliveryOrder = await this.orderRepository.updateDeliveryOrder(deliveryOrder._id.toString(), {
                    orderId: order._id,
                })
            }

            ApiResponse.success(deliveryOrder).send(res);
        } catch (e) {
            next(e);
        }
    }
}
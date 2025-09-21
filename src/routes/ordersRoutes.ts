import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken, { TokenController } from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import OrdersController from "../controllers/orders/ordersController";
import { deletePaymment } from "../middlewares/paymentsMiddlewares";
import { container } from "tsyringe";
import adminTokenValidation from "../middlewares/adminTokenValidation";
import { PrinterSpoolMiddleware } from "../middlewares/printerSpoolMiddleware";
import { OrdersMiddleware } from '../middlewares/ordersMiddleware';


const orderController = container.resolve(OrdersController);
const spoolMiddleware = container.resolve(PrinterSpoolMiddleware);
const tokenController = container.resolve(TokenController);
const orderMiddleware = container.resolve(OrdersMiddleware);

export default express.Router()
    .get(`${Endpoints.orders}/delivery_orders`, tokenController.userValidation, orderController.findAllDeliveryOrders)
    .get(Endpoints.orders, orderController.findAll, paginationAndFilters)
    .get(`${Endpoints.orders}/:id`, orderController.findOne)
    .post(Endpoints.orders, orderController.newOrder, orderMiddleware.addPreparationOrder, orderMiddleware.manageWithDrawMonitor, spoolMiddleware.printerSpoolMiddleware)
    .delete(`${Endpoints.orders}/:id`, adminTokenValidation, orderController.cancelOrder, deletePaymment, orderMiddleware.removePreparation, orderMiddleware.cancelDeliveryOrder, orderMiddleware.cancelWithdrawOrder, spoolMiddleware.removePrinterSpool)
    .put(`${Endpoints.orders}/set_preparation/:id`, validateToken, orderController.setPreparation, orderMiddleware.updateWithDrawMonitor, orderMiddleware.setOrderOnPreparation)
    .put(`${Endpoints.orders}/set_preparation_batch`, tokenController.userValidation, orderController.setPreparationBatch, orderMiddleware.updateWithDrawMonitorBatch, orderMiddleware.setOrdersOnPreparatioBatch)
    .patch(`${Endpoints.orders}/change_seller/:id`, adminTokenValidation, orderController.changeSeller)
    .patch(`${Endpoints.orders}/discount_apply/:id`, adminTokenValidation, orderController.applyOrderDiscount)
    .get(`${Endpoints.orders}/delivery_orders/:id`, tokenController.userValidation, orderController.findDeliveryOrderById)
    .post(`${Endpoints.orders}/delivery_orders/:storeCode`, orderController.requestDeliveryOrders)
    .patch(`${Endpoints.orders}/delivery_orders/:id`, orderController.updateDeliveryOrder, orderMiddleware.manageDeliveryOrder)
    .delete("/clean_orders_preparation", adminTokenValidation, orderController.checkPreparationOrders)
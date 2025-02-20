import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import OrdersController from "../controllers/orders/ordersController";
import {printerSpoolMiddleware, removePrinterSpool} from "../middlewares/printerSpoolMiddleware";
import {addPreparationOrder, manageWithDrawMonitor, setOrderOnPreparation, updateWithDrawMonitor, removePreparation} from "../middlewares/ordersMiddleware";
import { deletePaymment } from "../middlewares/paymentsMiddlewares";
import { container } from "tsyringe";
import IOrderRepository from "../domain/interfaces/IOrderRepository";
import MongoOrderRepository from "../repository/mongoOrderRepository";
import adminTokenValidation from "../middlewares/adminTokenValidation";

container.resolve<IOrderRepository>(MongoOrderRepository);
const orderController = container.resolve(OrdersController);

export default express.Router()
    .get(Endpoints.orders, orderController.findAll, paginationAndFilters)
    .get(`${Endpoints.orders}/:id`, orderController.findOne)
    .post(Endpoints.orders, orderController.newOrder, addPreparationOrder, manageWithDrawMonitor, printerSpoolMiddleware)
    .delete(`${Endpoints.orders}/:id`, adminTokenValidation, orderController.cancelOrder, deletePaymment, removePreparation, removePrinterSpool)
    .put(`${Endpoints.orders}/set_preparation/:id`, validateToken, orderController.setPreparation, updateWithDrawMonitor, setOrderOnPreparation)
    .patch(`${Endpoints.orders}/transfer`, adminTokenValidation, OrdersController.transfer)
    .patch(`${Endpoints.orders}/change_seller/:id`, adminTokenValidation, orderController.changeSeller)
    .patch(`${Endpoints.orders}/discount_apply/:id`, adminTokenValidation, orderController.applyOrderDiscount)
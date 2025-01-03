import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import OrdersController from "../controllers/orders/ordersController";
import {printerSpoolMiddleware, removePrinterSpool} from "../middlewares/printerSpoolMiddleware";
import {addPreparationOrder, manageWithDrawMonitor, setOrderOnPreparation, updateWithDrawMonitor, removePreparation} from "../middlewares/ordersMiddleware";
import { deletePaymment } from "../middlewares/paymentsMiddlewares";

export default express.Router()
    .get(Endpoints.orders, OrdersController.findAll, paginationAndFilters)
    .get(`${Endpoints.orders}/:id`, OrdersController.findOne)
    .post(Endpoints.orders, OrdersController.newOrder, addPreparationOrder, manageWithDrawMonitor, printerSpoolMiddleware)
    .delete(`${Endpoints.orders}/:id`, validateToken, OrdersController.cancelOrder, deletePaymment, removePreparation, removePrinterSpool)
    .put(`${Endpoints.orders}/set_preparation/:id`, validateToken, OrdersController.setPreparation, updateWithDrawMonitor, setOrderOnPreparation)
    .patch(`${Endpoints.orders}/transfer`, validateToken, OrdersController.transfer)
    .patch(`${Endpoints.orders}/change_seller/:id`, validateToken, OrdersController.changeSeller)
    .patch(`${Endpoints.orders}/discount_apply/:id`, validateToken, OrdersController.applyOrderDiscount)
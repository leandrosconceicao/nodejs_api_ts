import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import OrdersController from "../controllers/orders/ordersController";
import printerSpoolMiddleware from "../middlewares/printerSpoolMiddleware";
import {addPreparationOrder, manageWithDrawMonitor, getOrdersOnPreparation, setOrderOnPreparation, updateWithDrawMonitor} from "../middlewares/ordersMiddleware";

export default express.Router()
    .get(Endpoints.orders, OrdersController.findAll, paginationAndFilters)
    .get(`${Endpoints.orders}/:id`, OrdersController.findOne)
    .get(`${Endpoints.orders}/orders_on_preparation/:id`, OrdersController.getOrdersOnPreparation, getOrdersOnPreparation)
    .post(Endpoints.orders, OrdersController.newOrder, addPreparationOrder, manageWithDrawMonitor, printerSpoolMiddleware)
    .put(`${Endpoints.orders}/cancel_order`, validateToken, OrdersController.cancelOrder)
    .put(`${Endpoints.orders}/set_preparation/:id`, validateToken, OrdersController.setPreparation, updateWithDrawMonitor, setOrderOnPreparation)
    .patch(`${Endpoints.orders}/transfer`, validateToken, OrdersController.transfer)
    .patch(`${Endpoints.orders}/change_seller/:id`, validateToken, OrdersController.changeSeller)
    .patch(`${Endpoints.orders}/new_product/:id`, validateToken, OrdersController.pushNewItems)
    .patch(`${Endpoints.orders}/remove_product/:id`, validateToken, OrdersController.pullItem)
import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import OrdersController from "../controllers/orders/ordersController";
import printerSpoolMiddleware from "../middlewares/printerSpoolMiddleware";

export default express.Router()
    .get(Endpoints.orders, OrdersController.findAll, paginationAndFilters)
    .get(`${Endpoints.orders}/:id`, OrdersController.findOne)
    .get(`${Endpoints.orders}/orders_on_preparation/:id`, OrdersController.getOrdersOnPreparation)
    .post(Endpoints.orders, OrdersController.newOrder, printerSpoolMiddleware)
    .put(`${Endpoints.orders}/cancel_order`, validateToken, OrdersController.cancelOrder)
    .put(`${Endpoints.orders}/set_preparation/:id`, validateToken, OrdersController.setPreparation)
    .patch(`${Endpoints.orders}/transfer`, validateToken, OrdersController.transfer)
    .patch(`${Endpoints.orders}/change_seller/:id`, validateToken, OrdersController.changeSeller)
    .patch(`${Endpoints.orders}/new_product/:id`, validateToken, OrdersController.pushNewItems)
    .patch(`${Endpoints.orders}/remove_product/:id`, validateToken, OrdersController.pullItem)
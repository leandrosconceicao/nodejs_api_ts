import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import OrdersController from "../controllers/orders/ordersController";

export default express.Router()
    .get(Endpoints.orders, validateToken, OrdersController.findAll, paginationAndFilters)
    .get(`${Endpoints.orders}/:id`, validateToken, OrdersController.findOne)
    .post(Endpoints.orders, validateToken, OrdersController.newOrder)
    .put(`${Endpoints.orders}/cancel_order`, validateToken, OrdersController.cancelOrder)
    .put(`${Endpoints.orders}/setPreparation/:id`, validateToken, OrdersController.setPreparation)
    .patch(`${Endpoints.orders}/tranfer`, validateToken, OrdersController.transfer)
    .patch(`${Endpoints.orders}/change_seller/:id`, validateToken, OrdersController.changeSeller)
    .patch(`${Endpoints.orders}/new_product/:id`, validateToken, OrdersController.pushNewItems)
    .patch(`${Endpoints.orders}/remove_product/:id`, validateToken, OrdersController.pullItem)
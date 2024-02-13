import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import OrdersController from "../controllers/orders/ordersController";

export default express.Router()
    .post(Endpoints.orders, OrdersController.newOrder)
import express from "express";
import ProductController from "../controllers/products/productController";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default express.Router()
    .get(Endpoints.products, ProductController.findAll, paginationAndFilters)
    .get(`${Endpoints.products}/:id`, ProductController.findOne)
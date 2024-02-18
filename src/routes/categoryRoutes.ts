import express from "express";
import Endpoints from "../models/Endpoints";
import CategoryController from "../controllers/products/categoriesController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";

export default express.Router()
    .get(Endpoints.categories, validateToken, CategoryController.findAll, paginationAndFilters)
    .get(`${Endpoints.categories}/:id`, validateToken, CategoryController.findOne)
    .post(Endpoints.categories, validateToken, CategoryController.add)
    .put(Endpoints.categories, validateToken, CategoryController.updateName)
    .patch(Endpoints.categories, validateToken, CategoryController.changeOrder)
    .delete(Endpoints.categories, validateToken, CategoryController.delete)
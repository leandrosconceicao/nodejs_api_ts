import { container } from 'tsyringe';
import express from "express";
import Endpoints from "../models/Endpoints";
import CategoryController from "../controllers/products/categoriesController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";
const categoryController = container.resolve(CategoryController);

export default express.Router()
    .get(Endpoints.categories, validateToken, categoryController.findAll, paginationAndFilters)
    .get(`${Endpoints.categories}/:id`, validateToken, categoryController.findOne)
    .post(Endpoints.categories, validateToken, categoryController.add)
    .put(`${Endpoints.categories}/:id`, validateToken, categoryController.update)
    .patch(`${Endpoints.categories}/:storeCode`, validateToken, categoryController.updateOrdenation)
    .delete(`${Endpoints.categories}/:id`, validateToken, categoryController.delete)
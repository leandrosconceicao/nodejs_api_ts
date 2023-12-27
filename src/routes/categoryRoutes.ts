import express from "express";
import Endpoints from "../models/Endpoints";
import CategoryController from "../controllers/products/categoriesController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default express.Router()
    .get(Endpoints.categories, CategoryController.findAll, paginationAndFilters)
    // .get(`${Endpoints.categories}:id`, CategoryController.findOn)
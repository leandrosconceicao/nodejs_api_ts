import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import ReportsController from "../controllers/reports/reportsController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default express.Router()
    .get(Endpoints.quantSales, validateToken, validateToken, ReportsController.quantifySales)
    .get(Endpoints.quantSalesByProduct, validateToken, ReportsController.quantifySalesByProduct)
    .get(`${Endpoints.reports}/average_preparation_time`, validateToken, ReportsController.averagePreparationTime)
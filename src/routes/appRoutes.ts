import express from "express";
import validateToken from "../middlewares/tokenController";
import Endpoints from "../models/Endpoints";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import AppsController from "../controllers/apps/appsController";

export default express.Router()
    .get(Endpoints.apps, validateToken, AppsController.findAll, paginationAndFilters)
    .get(`${Endpoints.apps}/validate_app`, AppsController.validateVersion)
    .get(`${Endpoints.apps}/:id`, validateToken, AppsController.findOne)
    .post(Endpoints.apps, validateToken, AppsController.add)
    .put(`${Endpoints.apps}/:id`, validateToken, AppsController.update)
    .delete(`${Endpoints.apps}/:id`, validateToken, AppsController.delete)
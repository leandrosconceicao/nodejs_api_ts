import express from "express";
import validateToken from "../middlewares/tokenController";
import Endpoints from "../models/Endpoints";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import AppsController from "../controllers/apps/appsController";
import { container } from "tsyringe";
import IAppRepository from "../domain/interfaces/IAppRepository";
import { MongoAppRepository } from "../repository/mongoAppRepository";

container.resolve<IAppRepository>(MongoAppRepository);
const controller = container.resolve(AppsController);

export default express.Router()
    .get(Endpoints.apps, validateToken, controller.findAll, paginationAndFilters)
    .get(`${Endpoints.apps}/validate_app`, controller.validateVersion)
    .get(`${Endpoints.apps}/:id`, validateToken, controller.findOne)
    .post(Endpoints.apps, validateToken, controller.add)
    .put(`${Endpoints.apps}/:id`, validateToken, controller.update)
    .delete(`${Endpoints.apps}/:id`, validateToken, controller.delete)
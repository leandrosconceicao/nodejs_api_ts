import {Router} from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import EstablishmentsController from "../controllers/establishments/establishmentController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import { container } from "tsyringe";
import IEstablishmentRepository from "../domain/interfaces/IEstablishmentRepository";
import MongoEstablishmentRespository from "../repository/mongoEstablishmentRepository";
import superUserTokenValidation from "../middlewares/superUserTokenValidation";

container.resolve<IEstablishmentRepository>(MongoEstablishmentRespository);

const establishmentController = container.resolve(EstablishmentsController);

export default Router()
    .get(Endpoints.establishments, validateToken, establishmentController.findAll, paginationAndFilters)
    .get(`${Endpoints.establishments}/:id`, establishmentController.findOne)
    .post(Endpoints.establishments, validateToken, establishmentController.add)
    .delete(`${Endpoints.establishments}/:id`, superUserTokenValidation, establishmentController.delete)
    .put(`${Endpoints.establishments}/:id`, validateToken, establishmentController.put)
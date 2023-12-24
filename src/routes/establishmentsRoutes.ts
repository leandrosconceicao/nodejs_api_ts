import {Router} from "express";
import Endpoints from "../models/Endpoints";
import EstablishmentsController from "../controllers/establishments/establishmentController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default Router()
    .get(Endpoints.establishments, EstablishmentsController.findAll, paginationAndFilters)
    .get(`${Endpoints.establishments}/:id`, EstablishmentsController.findOne)
    .post(Endpoints.establishments, EstablishmentsController.add)
    .delete(Endpoints.establishments, EstablishmentsController.delete)
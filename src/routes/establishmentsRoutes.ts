import {Router} from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import EstablishmentsController from "../controllers/establishments/establishmentController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default Router()
    .get(Endpoints.establishments, validateToken, EstablishmentsController.findAll, paginationAndFilters)
    .get(`${Endpoints.establishments}/:id`, validateToken, EstablishmentsController.findOne)
    .post(Endpoints.establishments, validateToken, EstablishmentsController.add)
    .delete(Endpoints.establishments, validateToken, EstablishmentsController.delete)
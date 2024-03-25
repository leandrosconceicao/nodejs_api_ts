import {Router} from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import EstablishmentsController from "../controllers/establishments/establishmentController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default Router()
    .get(Endpoints.establishments, validateToken, EstablishmentsController.findAll, paginationAndFilters)
    .get(`${Endpoints.establishments}/:id`, EstablishmentsController.findOne)
    .post(Endpoints.establishments, validateToken, EstablishmentsController.add)
    .delete(Endpoints.establishments, validateToken, EstablishmentsController.delete)
    .put(`${Endpoints.establishments}/:id`, EstablishmentsController.put)
    .patch(`${Endpoints.establishments}/upload_logo/:id`, EstablishmentsController.updateLogo)
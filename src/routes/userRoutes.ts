import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import {UserController} from "../controllers/users/userController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default express.Router()
    .get(Endpoints.users, validateToken, UserController.findAll, paginationAndFilters)
    .get(`${Endpoints.users}/:id`,  validateToken, UserController.findOne)
    .post(Endpoints.users, validateToken, UserController.add)
    .delete(`${Endpoints.users}/:id`, validateToken, UserController.delete)
    .post(Endpoints.authentication, UserController.authenticate)
    // .patch(`${Endpoints.users}/change_password`, validateToken, UserController.updatePass)
    .patch(`${Endpoints.users}/:id`, validateToken, UserController.patch)
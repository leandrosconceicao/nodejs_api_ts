import 'reflect-metadata';
import express from "express";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import {UserController} from "../controllers/users/userController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import { container } from "tsyringe";
import adminTokenValidation from '../middlewares/adminTokenValidation';
import tokenController from '../middlewares/tokenController';

const userController = container.resolve(UserController);

export default express.Router()
    .get(Endpoints.users, validateToken, userController.findAll, paginationAndFilters)
    .get(`${Endpoints.users}/:id`,  validateToken, userController.findOne)
    .post(Endpoints.users, adminTokenValidation, userController.add)
    .delete(`${Endpoints.users}/:id`, adminTokenValidation, userController.delete)
    .post(Endpoints.authentication, userController.authenticate)
    .patch(`${Endpoints.users}/change_password`, adminTokenValidation, userController.updatePass)
    .patch(`${Endpoints.users}/:id`, tokenController, userController.patch)
    .put(`${Endpoints.users}/update_basic_info/:id`, validateToken, userController.updateUserData)
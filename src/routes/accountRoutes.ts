import express from "express";
import Endpoints from "../models/Endpoints.js";
import AccountsController from "../controllers/accounts/accountsController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";

export default express.Router()
    .get(Endpoints.accounts, validateToken, AccountsController.findAll, paginationAndFilters)
    .get(`${Endpoints.accounts}/:id`, validateToken, AccountsController.findOne)
    .post(Endpoints.accounts, validateToken, AccountsController.addNew)
    .put(`${Endpoints.accounts}/manage_status/:id`, validateToken, AccountsController.manageStatus)
    .put(`${Endpoints.accounts}/:id`, validateToken, AccountsController.edit)
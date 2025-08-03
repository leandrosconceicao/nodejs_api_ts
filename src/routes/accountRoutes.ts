import express from "express";
import Endpoints from "../models/Endpoints";
import AccountsController from "../controllers/accounts/accountsController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken, { TokenController } from "../middlewares/tokenController";
import { container } from "tsyringe";
import IAccountRepository from "../domain/interfaces/IAccountRepository";
import MongoAccountRepository from "../repository/mongoAccountRepository";

container.resolve<IAccountRepository>(MongoAccountRepository);
const accountController = container.resolve(AccountsController);
const tokenController = container.resolve(TokenController)

export default express.Router()
    .get(Endpoints.accounts, validateToken, accountController.findAll, paginationAndFilters)
    .get(`${Endpoints.accounts}/:id`, validateToken, accountController.findOne)
    .get(`${Endpoints.accounts}/v2/:id`, validateToken, accountController.findOne)
    .post(Endpoints.accounts, tokenController.userValidation, accountController.addNew)
    .patch(`${Endpoints.accounts}/manage_account_tip/:storeCode/:accountId`, validateToken, accountController.manageAccountTip)
    .put(`${Endpoints.accounts}/manage_status/:id`, validateToken, accountController.manageStatus)
    .put(`${Endpoints.accounts}/:id`, validateToken, accountController.edit)
    .delete(`${Endpoints.accounts}/:id`, validateToken, accountController.del)
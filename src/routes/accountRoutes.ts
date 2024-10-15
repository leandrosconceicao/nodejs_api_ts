import express from "express";
import Endpoints from "../models/Endpoints";
import AccountsController from "../controllers/accounts/accountsController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";

export default express.Router()
    .get(Endpoints.accounts, validateToken, AccountsController.findAll, paginationAndFilters)
    .get(`${Endpoints.accounts}/:id`, validateToken, AccountsController.findOne)
    .get(`${Endpoints.accounts}/v2/:id`, validateToken, AccountsController.findOneV2)
    .post(Endpoints.accounts, validateToken, AccountsController.addNew)
    .patch(`${Endpoints.accounts}/manage_account_tip/:storeCode/:accountId`, validateToken, AccountsController.manageAccountTip)
    .put(`${Endpoints.accounts}/manage_status/:id`, validateToken, AccountsController.manageStatus)
    .put(`${Endpoints.accounts}/:id`, validateToken, AccountsController.edit)
    .delete(`${Endpoints.accounts}`, validateToken, AccountsController.del)
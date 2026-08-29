import express from "express";
import Endpoints from "../models/Endpoints";
import PaymentController from "../controllers/payments/paymentController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";
import PaymentMethodsController from "../controllers/payments/paymentMethodsControllers";
import { CashRegisterController } from "../controllers/payments/cashRegisterController";
import { container } from "tsyringe";

const paymentMethodsCtrl = container.resolve(PaymentMethodsController);
const cashRegisterCtrl = container.resolve(CashRegisterController);

export default express.Router()
    .post(`${Endpoints.payments}/cash_register`, validateToken, cashRegisterCtrl.onNewData)
    .get(`${Endpoints.payments}/cash_register`, validateToken, cashRegisterCtrl.onFindAll, paginationAndFilters)
    .get(`${Endpoints.payments}/cash_register/:userId`, validateToken, cashRegisterCtrl.getUserCash)
    .get(`${Endpoints.payments}/cash_register/detail/:id`, validateToken, cashRegisterCtrl.detail)
    .patch(`${Endpoints.payments}/cash_register/:id`, validateToken, cashRegisterCtrl.onUpdateData)
    .delete(`${Endpoints.payments}/cash_register/:id`, validateToken, cashRegisterCtrl.onDeleteData)
    .post(`${Endpoints.payments}/payment_methods`, validateToken, paymentMethodsCtrl.onNewData)
    .get(`${Endpoints.payments}/payment_methods`, paymentMethodsCtrl.onFindAll)
    .get(`${Endpoints.payments}/payment_methods/:id`, validateToken, paymentMethodsCtrl.getUserCash)
    .patch(`${Endpoints.payments}/payment_methods/:id`, validateToken, paymentMethodsCtrl.onUpdateData)
    .delete(`${Endpoints.payments}/payment_methods/:id`, validateToken, paymentMethodsCtrl.onDeleteData)
    .get(Endpoints.payments, validateToken, validateToken, PaymentController.findAll, paginationAndFilters)
    .get(`${Endpoints.payments}/:storeCode/:accountId`, validateToken, validateToken, PaymentController.findAllByAccount, paginationAndFilters)
    .get(`${Endpoints.payments}/:id`, validateToken, PaymentController.findOne)
    .post(Endpoints.payments, validateToken, PaymentController.add)
    .delete(Endpoints.payments, validateToken, PaymentController.rollBackPayments)


import express from "express";
import Endpoints from "../models/Endpoints";
import PaymentController from "../controllers/payments/paymentController";
import PixChargesController from "../controllers/payments/pixChargesController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";
import CardPaymentsController from "../controllers/payments/cardPayments";
import PaymentMethodsController from "../controllers/payments/paymentMethodsControllers";
import {CashRegisterController} from "../controllers/payments/cashRegisterController";

const paymentMethodsCtrl = new PaymentMethodsController();
const cashRegisterCtrl = new CashRegisterController();

export default express.Router()
    .post(`${Endpoints.payments}/cash_register`,  validateToken, cashRegisterCtrl.onNewData)
    .get(`${Endpoints.payments}/cash_register`,  validateToken, cashRegisterCtrl.onFindAll, paginationAndFilters)
    .get(`${Endpoints.payments}/cash_register/:userId`,  validateToken, cashRegisterCtrl.getUserCash)
    .get(`${Endpoints.payments}/cash_register/detail/:id`, validateToken, cashRegisterCtrl.detail)
    .patch(`${Endpoints.payments}/cash_register/:id`,  validateToken, cashRegisterCtrl.onUpdateData)
    .delete(`${Endpoints.payments}/cash_register/:id`,  validateToken, cashRegisterCtrl.onDeleteData)
    .post(`${Endpoints.payments}/payment_methods`, validateToken, paymentMethodsCtrl.onNewData)
    .get(`${Endpoints.payments}/payment_methods`, paymentMethodsCtrl.onFindAll)
    .get(`${Endpoints.payments}/payment_methods/:id`, validateToken, paymentMethodsCtrl.getUserCash)
    .patch(`${Endpoints.payments}/payment_methods/:id`, validateToken, paymentMethodsCtrl.onUpdateData)
    .delete(`${Endpoints.payments}/payment_methods/:id`, validateToken, paymentMethodsCtrl.onDeleteData)
    .post(`${Endpoints.payments}/card_payments`, CardPaymentsController.post)
    .delete(`${Endpoints.payments}/card_payments`, CardPaymentsController.cancel)
    .get(`${Endpoints.payments}/check_pix/:txid`, validateToken, PixChargesController.validatePaymentChargeCheck)
    .get(`${Endpoints.payments}/validate_payment/:txid`, PixChargesController.validatePaymentCharge)
    .post(`${Endpoints.payments}/charges/webhook(/pix)?`, PixChargesController.webhook)
    .post(`${Endpoints.payments}/create_charge`, validateToken, PixChargesController.createCharge)
    .delete(`${Endpoints.payments}/cancel_pix_charge/:txId`, validateToken, PixChargesController.cancelPixCharge)
    .get(`${Endpoints.payments}/pix_charges`, PixChargesController.findAll)
    .get(Endpoints.payments, validateToken, validateToken, PaymentController.findAll, paginationAndFilters)
    .get(`${Endpoints.payments}/:storeCode/:accountId`, validateToken, validateToken, PaymentController.findAllByAccount, paginationAndFilters)
    .get(`${Endpoints.payments}/:id`, validateToken, PaymentController.findOne)
    .post(Endpoints.payments, validateToken, PaymentController.add)
    .delete(Endpoints.payments, validateToken, PaymentController.rollBackPayments)


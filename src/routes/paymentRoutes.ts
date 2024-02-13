import express from "express";
import Endpoints from "../models/Endpoints";
import PaymentController from "../controllers/payments/paymentController";
import PixChargesController from "../controllers/payments/pixChargesController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";

export default express.Router()
    .get(`${Endpoints.payments}/validate_payment/:txid`, PixChargesController.validatePaymentCharge)
    .post(`${Endpoints.charges}/webhook(/pix)?`, PixChargesController.webhook)
    .post(`${Endpoints.payments}/create_charge`, validateToken, PixChargesController.createCharge)
    .delete(`${Endpoints.payments}/cancel_pix_charge`, validateToken, PixChargesController.cancelPixCharge)
    .get(Endpoints.payments, validateToken, validateToken, PaymentController.findAll, paginationAndFilters)
    .get(`${Endpoints.payments}/:id`, validateToken, PaymentController.findOne)
    .post(Endpoints.payments, validateToken, PaymentController.add)
    .delete(Endpoints.payments, validateToken, PaymentController.rollBackPayments)


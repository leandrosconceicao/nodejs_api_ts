import { Request, Response, NextFunction } from "express";
import {z} from "zod";
import MercadopagoApi from "../../utils/mercadopago/payments";
import { paymentInputRequest } from "../../models/mercadopago/paymentIntent";
import ApiResponse from "../../models/base/ApiResponse";

const API = new MercadopagoApi();

export default class CardPaymentsController {
    static async post(req: Request, res: Response, next: NextFunction) {
        try {
            const data = paymentInputRequest.parse(req.body);
            const process = await API.newPaymentIntent(data);
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async cancel(req: Request, res: Response, next: NextFunction) {
        try {
            const id = z.string().min(1).max(100).parse(req.body.id);
            const process = await API.cancelPayment(id);
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
}
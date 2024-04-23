import { PaymentResult } from "../../models/mercadopago/paymentIntent";
import axios, { AxiosResponse } from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const APITOKEN = process.env.APITOKEN;
const API_URL = process.env.MERCADOPAGO_ENDPOINT;
const DEVICE = process.env.DEVICE_ID;

export default class MercadopagoApi {

    async newPaymentIntent(data: any) {
        const res = await axios<PaymentResult>({
            method: "POST",
            url: `${API_URL}/devices/${DEVICE}/payment-intents`,
            headers: setHeaders(APITOKEN),
            data: data
        });
        return res.data as PaymentResult;
    }

    async getPaymentIntent(id: string) {
        return axios({
            method: "GET",
            url: `${API_URL}/payment-intents/${id}`
        })
    }

    async cancelPayment(id: string) {
        const req = await  axios({
            method: "DELETE",
            url: `${API_URL}/devices/${DEVICE}/payment-intents/${id}`
        });
        return req;
    }
}

function setHeaders(token: string) {
    return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
    };
}
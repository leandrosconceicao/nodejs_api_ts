import axios from "axios";
import * as dotenv from "dotenv";
import {Request} from "express";

dotenv.config();

const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL;
const BOT_TOKEN = process.env.TELEGRAMKEY;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export default class ErrorAlerts {

    static async sendAlert(error: Error, req: Request) {
        
        try {
            await axios.post(`${TELEGRAM_API_URL}/bot${BOT_TOKEN}/sendMessage`, {
                "chat_id": CHAT_ID,
                "text": `Houve um erro não tratado\n${error}\n\nURL: ${req.url}\nMETHOD: ${req.method}\nBODY: ${JSON.stringify(req.body)}}`
            });
        } catch (e) {
            console.log(e);
        }
    }

    static async sendDefaultAlert(error: Error, info: any = undefined) {
        
        try {
            await axios.post(`${TELEGRAM_API_URL}/bot${BOT_TOKEN}/sendMessage`, {
                "chat_id": CHAT_ID,
                "text": `Houve um erro não tratado\n${error}INFO: ${info ? JSON.stringify(info) : ""}}`
            });
        } catch (e) {
            console.log(e);
        }
    }
}
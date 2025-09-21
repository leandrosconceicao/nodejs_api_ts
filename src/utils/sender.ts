import { delay, injectable, registry } from "tsyringe";
import { ISender } from "../domain/interfaces/ISender";
import axios from "axios";
import * as dotenv from "dotenv";
import {Request} from "express";

dotenv.config();

const TELEGRAM_API_URL = process.env.TELEGRAM_API_URL;
const BOT_TOKEN = process.env.TELEGRAMKEY;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

@injectable()
@registry([
    {
        token: "ISender",
        useToken: delay(() => Sender)
    }
])
export class Sender implements ISender {

    url: string = `${TELEGRAM_API_URL}/bot${BOT_TOKEN}/sendMessage`;

    errorAlert = async (error: Error, req: Request): Promise<void> => {
        
        await this.sendMessage(`Houve um erro não tratado\n${error}\n\nURL: ${req.url}\nMETHOD: ${req.method}\nBODY: ${JSON.stringify(req.body)}}`);
        
    }
    errorAlertGeneral = async (error: Error, info?: any): Promise<void>  => {
        this.sendMessage(`Houve um erro não tratado\n${error}INFO: ${info ? JSON.stringify(info) : ""}}`);
    }

    infoAlert = async (message: string): Promise<void> => {
        await this.sendMessage(message);
    }

    private async sendMessage(message: string) {
        try {
            await axios.post(this.url, {
                "chat_id": CHAT_ID,
                "text": message
            });
        } catch (e) {
            console.log(e);
        }
    }
}
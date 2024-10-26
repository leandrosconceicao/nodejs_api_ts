import WebSocket from "ws";
import {IncomingMessage} from "http";
import {CHAT_MESSAGE_VALIDATION} from "../models/chat/ChatMessage";
import ISocketMessages from "../domain/interfaces/ISocketMessages";
import { NextFunction, Request, Response } from "express";
import Endpoints from "../models/Endpoints";
import OrderMessages from "../models/chat/OrderMessages";


export default class WebSocketService {

    wss: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>

    constructor(websocket: WebSocket.Server<typeof WebSocket, typeof IncomingMessage>) {
        this.wss = websocket;
    }
    
    _postMessage(body: any) {
        try {
            const message = <ISocketMessages>{};
            CHAT_MESSAGE_VALIDATION.transform((val) => {
                message.sentAt = new Date();
                message.id = val.id ?? "";
                message.message = val.message;
                message.user = val.user;
            }).parse(body);
            const clients = this.wss.clients;
            clients.forEach((cli) => {
                if (cli.readyState === WebSocket.OPEN) {
                    cli.send(JSON.stringify(message));
                }
            });    
        } catch (e) {
            console.error(e);
        } 
    }

    newOrderCreated(data: ISocketMessages) {
        try {
            this.wss.clients.forEach((cli) => {
                if (cli.readyState === WebSocket.OPEN) {
                    cli.send(JSON.stringify(data));
                }
            })
        } catch (e) {
            console.error(e);
        }
    }

    handlerRequest(req: Request, res: Response, next: NextFunction) {
        if (req.path === "/post_message") {
            this._postMessage(req.body);           
        }
        if (req.path === Endpoints.orders && req.method === "POST") {
            this.newOrderCreated(new OrderMessages(
                "Novo pedido realizado",
                null,
                req.headers.authorization,
                req.body
            ))
        }
        next();
    }

}
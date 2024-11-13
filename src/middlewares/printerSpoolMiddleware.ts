import { NextFunction, Request, Response } from "express";
import { IOrder } from "../models/Orders";
import ApiResponse from "../models/base/ApiResponse";
import {IPrinterSpool, PrinterSpool} from "../models/PrinterSpool";
import LogsController from "../controllers/logs/logsController";

export default async function printerSpoolMiddleware(req: Request, res: Response, next: NextFunction) {
    const order = req.result as IOrder;
    try {        
        const data = <Partial<IPrinterSpool>>{
            type: "order",
            storeCode: `${order.storeCode}`,
            orderId: `${order._id}`,
        };
        if (order.accountId) {
            data.accountId = `${order.accountId}`
        }
        new PrinterSpool({
            storeCode: order.storeCode,
            orderId: order._id,
            accountId: order.accountId,
        }).save();

    } catch (e) {
        const log = new LogsController();
        log.saveReqLog(req, e);
    }
    return ApiResponse.success(order).send(res);
}
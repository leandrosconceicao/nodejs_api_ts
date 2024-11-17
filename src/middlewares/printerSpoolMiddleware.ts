import { NextFunction, Request, Response } from "express";
import { IOrder } from "../models/Orders";
import ApiResponse from "../models/base/ApiResponse";
import { IPrinterSpool, SpoolType } from "../models/PrinterSpool";
import LogsController from "../controllers/logs/logsController";
import SpoolHandler from "../domain/handlers/spoolHandler";
import { getDatabase } from "firebase-admin/database";

async function spoolManagement(req: Request, res: Response, next: NextFunction) {
    const spool = req.result as IPrinterSpool
    const handler = new SpoolHandler();
    try {
        const data = await handler.prepareData(spool);
        const db = getDatabase();
        db.ref(`${data.storeCode}`).child("spool").push(data, (value) => {
            if (value) {
                throw value;
            }
            ApiResponse.success(data).send(res);
        });
    } catch (e) {
        next(e);
    }
}

async function printerSpoolMiddleware(req: Request, res: Response, next: NextFunction) {
    const order = req.result as IOrder;
    const handler = new SpoolHandler();
    try {
        const data = await handler.prepareData({
            type: SpoolType.order,
            storeCode: `${order.storeCode}`,
            orderId: `${order._id}`,
            accountId: `${order?.accountId ?? ""}`,
            reprint: false
        })
        const db = getDatabase();
        db.ref(`${data.storeCode}`).child("spool").push(data);

    } catch (e) {
        const log = new LogsController();
        log.saveReqLog(req, e);
    }
    return ApiResponse.success(order).send(res);
}

export {printerSpoolMiddleware, spoolManagement}
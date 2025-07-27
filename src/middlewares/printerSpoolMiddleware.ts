import { NextFunction, Request, Response } from "express";
import { IOrder } from "../models/Orders";
import ApiResponse from "../models/base/ApiResponse";
import { IPrinterSpool, SpoolType } from "../domain/types/IPrinterSpool";
import { autoInjectable, inject } from "tsyringe";
import ICloudService from "../domain/interfaces/ICloudService";
import ErrorAlerts from "../utils/errorAlerts";

@autoInjectable()
export class PrinterSpoolMiddleware {
    
    constructor(
        @inject('ICloudService') private readonly cloudService : ICloudService
    ) {}

    spoolManagement = async (req: Request, res: Response, next: NextFunction) => {
        const spool = req.result as IPrinterSpool;

        try {
            const data = await this.cloudService.pushSpoolData(spool);

            return ApiResponse.success(data).send(res);

        } catch (e) {
            next(e);
        }
    }

    removePrinterSpool = async (req: Request, res: Response, _: NextFunction) => {
        const order = req.result as IOrder;
        try {
            this.cloudService.removeSpoolData(`${order.storeCode}`, `${order._id}`);
        } catch (e) {
            ErrorAlerts.sendDefaultAlert(e);
        }
        ApiResponse.success(req.result).send(res);
    }

    fetchSpool = async (req: Request, res: Response, _: NextFunction) => {
        const storeCode = req.result;

        const values = await this.cloudService.findSpoolData(storeCode);

        if (!values) {
            res.sendStatus(204);
        } else {
            const data = Object.entries(values).map((value) => value[1]);
            ApiResponse.success(data).send(res);
        }
    }

    printerSpoolMiddleware = async (req: Request, res: Response, _: NextFunction) => {
        const order = req.result as IOrder;
        try {
            
            await this.cloudService.pushSpoolData({
                type: SpoolType.order,
                storeCode: `${order.storeCode}`,
                orderId: `${order._id}`,
                accountId: `${order?.accountId ?? ""}`,
                reprint: false,
                createdAt: new Date().toISOString(),
            })            
    
        } catch (e) {
            if (!(e instanceof ApiResponse)) {
                ErrorAlerts.sendDefaultAlert(e);
            }
        }
        return ApiResponse.success(order).send(res);
    }
}
import { NextFunction, Request, Response } from "express";
import { idValidation } from "../../utils/defaultValidations";
import {PrinterSpool, IPrinterSpool, PRINTER_SPOOL_VALIDATION} from "../../models/PrinterSpool";
import mongoose from "mongoose";
import ApiResponse from "../../models/base/ApiResponse";
import ISpoolHandler from "../../domain/interfaces/ISpoolHandler";

var ObjectId = mongoose.Types.ObjectId;

export default class PrintSpoolController {

    private handler : ISpoolHandler

    constructor(spoolHandler: ISpoolHandler) {
        this.handler = spoolHandler;
    }

    async add(req: Request, res: Response, next: NextFunction) {
        try {
            const body = PRINTER_SPOOL_VALIDATION
            .transform((data) => {
                data.createdAt = new Date().toISOString();
                return data;
            })
            .parse(req.body);
            req.result = body;
            next();
        } catch (e) {
            next(e);
        }
    }

    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const storeCode = idValidation.parse(req.params.storeCode);
            req.result = storeCode;
            next();
        } catch (e) {
            next(e);
        }
    }    

    async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            await PrinterSpool.findByIdAndDelete(id);
            res.sendStatus(204);
        } catch (e) {
            next(e);
        }
    }
}
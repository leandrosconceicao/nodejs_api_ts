import { NextFunction, Request, Response } from "express";
import { idValidation } from "../../utils/defaultValidations";
import {PrinterSpool, PRINTER_SPOOL_VALIDATION} from "../../models/PrinterSpool";
import mongoose from "mongoose";
import { autoInjectable, inject } from "tsyringe";
import ICloudService from "../../domain/interfaces/ICloudService";

var ObjectId = mongoose.Types.ObjectId;

@autoInjectable()
export default class PrintSpoolController {

    constructor(
        @inject('ICloudService') private readonly cloudService : ICloudService
    ) {}

    add = async (req: Request, res: Response, next: NextFunction) => {
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

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const store = idValidation.parse(req.params.storeCode);
            const id = idValidation.parse(req.params.id);
            await this.cloudService.removeSpoolData(store, id);
            res.sendStatus(204);
        } catch (e) {
            next(e);
        }
    }
}
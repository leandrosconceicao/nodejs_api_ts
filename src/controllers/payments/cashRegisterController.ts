import { Request, Response, NextFunction } from "express";
import BaseController from "../base/baseController";
import { CashRegister, cashRegisterCreationValidation } from "../../models/CashRegister";
import ApiResponse from "../../models/base/ApiResponse";

export default class CashRegisterController implements BaseController {

    async onNewData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rawData = cashRegisterCreationValidation.parse(req.body);
            const data = new CashRegister(rawData);
            await data.save();
            return ApiResponse.success(data, 201).send(res)
        } catch (e) {
            next(e);
        }
    }
    async onFindAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

        } catch (e) {
            next(e);
        }
    }
    async onFindOne(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

        } catch (e) {
            next(e);
        }
    }
    async onDeleteData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

        } catch (e) {
            next(e);
        }
    }
    async onUpdateData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {

        } catch (e) {
            next(e);
        }
    }

}
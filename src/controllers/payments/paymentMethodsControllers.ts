import { Request, Response, NextFunction } from "express";
import {z} from 'zod';
import { PaymentMethods, PaymentMethodsValidation } from "../../models/PaymentMethods";
import ApiResponse from "../../models/base/ApiResponse";
import BaseController from "../base/baseController";
import { idValidation } from "../../utils/defaultValidations";
import NotFoundError from "../../models/errors/NotFound";

export default class PaymentMethodsController implements BaseController {
    async onNewData(req: Request, res: Response, next: NextFunction) {
        try {
            const body = PaymentMethodsValidation.parse(req.body);
            const data = new PaymentMethods(body);
            await data.save();
            return ApiResponse.success(data, 201).send(res)
        } catch (e) {
            next(e);
        }
    }

    async onFindAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = z.object({
                storeCode: z.string().min(1),
            }).parse(req.query)
            const data = await PaymentMethods.find(query)
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
    async onFindOne(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.id);
            const query = await PaymentMethods.findById(id)
                .populate("created_by", ["-establishments", "-pass"])
            if (!query) {
                throw new NotFoundError();
            }
            return ApiResponse.success(query).send(res);
        } catch (e) {
            next(e);
        }
    }
    
    
    async onDeleteData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.id);
            const process = await PaymentMethods.findByIdAndDelete(id)
            if (!process) {
                throw new NotFoundError("Registro não localizado");
            }
            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }
    
    async onUpdateData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.id);
            const data = z.object({
                description: z.string().min(1).optional(),
                enabled: z.boolean().optional()
            }).parse(req.body);
            const process = await PaymentMethods.findByIdAndUpdate(id, data, {new: true});
            if (!process) {
                throw new NotFoundError("Registro não localizado");
            }
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
    
}
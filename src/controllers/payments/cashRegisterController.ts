import { Request, Response, NextFunction } from "express";
import BaseController from "../base/baseController";
import { cashMovementValidation, CashRegister, cashRegisterCreationValidation, cashRegisterValidationOptional } from "../../models/CashRegister";
import ApiResponse from "../../models/base/ApiResponse";
import { idValidation } from "../../utils/defaultValidations";
import z from 'zod';
import NotFoundError from "../../models/errors/NotFound";
import mongoose from "mongoose";
import CashRegisterError from "../../models/errors/CashRegisterError";
import { checkIfUserExists } from "../users/userController";
var ObjectId = mongoose.Types.ObjectId;

class CashRegisterController implements BaseController {

    async onNewData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const rawData = cashRegisterCreationValidation.parse(req.body);
            await checkIfUserExists(rawData.created_by);
            const cashOpens = await checkForOpenCashRegister(rawData.created_by);
            if (cashOpens) {
                throw new CashRegisterError("Usuário já possui caixa em aberto")   
            }
            const data = new CashRegister(rawData);
            await data.save();
            return ApiResponse.success(data, 201).send(res)
        } catch (e) {
            next(e);
        }
    }
    async onFindAll(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = cashRegisterValidationOptional.parse(req.query);
            query.deleted = {
                $eq: null
            }
            const data = await CashRegister.find(query);
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
    async onFindOne(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const query = idValidation.parse(req.params.id);
            const data = await CashRegister.findById(query)
            if (!data) {
                throw new NotFoundError("Registro não localizado");
            }
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
    async onDeleteData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.id);
            const process = await CashRegister.findByIdAndUpdate(id, {
                deleted: id
            })
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
            const data = z.intersection(
                z.object({
                    created_by: idValidation
                }),
                cashMovementValidation
            ).parse(req.body);
            const process = await CashRegister.findOneAndUpdate({
                _id: new ObjectId(id),
                created_by: new ObjectId(data.created_by)
            }, {
                $push: {
                    movements: {
                        description: data.description,
                        value: data.value,
                        type: data.type,
                    }
                }
            }, {
                new: true
            });
            if (!process) {
                throw new NotFoundError("Registro não localizado");
            }
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

}

async function checkForOpenCashRegister(created_by: string) : Promise<boolean> {
    const cashRegisters = await CashRegister.countDocuments({
        created_by: new ObjectId(created_by),
        status: 'open'
    });
    return cashRegisters > 0;
}

export {checkForOpenCashRegister, CashRegisterController};

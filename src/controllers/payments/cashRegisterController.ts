import { Request, Response, NextFunction } from "express";
import BaseController from "../base/baseController";
import {CashRegister, cashRegisterCreationValidation, cashRegisterValidationOptional, ICashRegister } from "../../models/CashRegister";
import {CASH_MOVEMENT_VALIDATION, CashRegisterMovements} from "../../models/CashRegisterMovement";
import ApiResponse from "../../models/base/ApiResponse";
import { idValidation } from "../../utils/defaultValidations";
import z from 'zod';
import NotFoundError from "../../models/errors/NotFound";
import mongoose from "mongoose";
import CashRegisterError from "../../models/errors/CashRegisterError";
import { checkIfUserExists } from "../users/userController";
import TokenGenerator from "../../utils/tokenGenerator";
import PaymentController from "./paymentController";
import { CASH_REGISTER_COMPARE_VALIDATION, CashRegisterCompare } from "../../models/CashRegisterCompare";
import { IPrinterSpool, SpoolType } from "../../domain/types/IPrinterSpool";
var ObjectId = mongoose.Types.ObjectId;

class CashRegisterController implements BaseController {

    async onNewData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const authUserData = z.object({
                id: idValidation
            }).parse(TokenGenerator.verify(req.headers.authorization));
            const rawData = cashRegisterCreationValidation.parse(req.body);
            rawData.created_by = authUserData.id;
            await checkIfUserExists(rawData.created_by);
            const cash = await getOpenCashRegister(rawData.created_by);
            if (cash) {
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
            req.result = CashRegister.find(query)
                .populate("userDetail", ["-establishments", "-pass"])
            next();
        } catch (e) {
            next(e);
        }
    }
    async getUserCash(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.userId);
            const data = await CashRegister.findOne({
                created_by: new ObjectId(id),
                status: "open"
            })
            // .populate("openValues.paymentMethodDetail")
            .populate("suppliersAndWithdraws")
            .populate("cashRegisterCompare")
            if (!data) {
                throw new NotFoundError("Usuário não possui caixa em aberto");
            }
            data.paymentsByMethod = await PaymentController.getPayments({
                cashRegisterId: data._id
            })
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }

    async detail(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.id);
            const data = await CashRegister.findById<ICashRegister>(id)
            .populate("userDetail", ["-establishments", "-pass"])
            .populate("suppliersAndWithdraws")
            .populate("cashRegisterCompare")
            .populate({
                path: "cashRegisterCompare",
                populate: {
                    path: "valuesByMethod.methodData",
                    model: "paymentMethods"
                }
            })
            if (!data) {
                throw new NotFoundError("Usuário não possui caixa em aberto");
            }
            data.paymentsByMethod = await PaymentController.getPayments({
                cashRegisterId: data._id
            })
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
    async onDeleteData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.id);
            const compareData = CASH_REGISTER_COMPARE_VALIDATION.parse(req.body);
            const process = await CashRegister.findByIdAndUpdate(id, {
                status: "closed",
                closedAt: new Date(),
            })
            if (!process) {
                throw new NotFoundError("Registro não localizado");
            }
            const cashCompare = new CashRegisterCompare(compareData);
            await cashCompare.save();
            req.result = <IPrinterSpool>{
                type: SpoolType.cashRegister,
                storeCode: process.storeCode,
                cashRegisterId: process._id,
                reprint: false,
                createdAt: new Date().toISOString()
            }
            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }
    async onUpdateData(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const id = idValidation.parse(req.params.id);
            const authUserData = z.object({
                id: idValidation,
            }).parse(TokenGenerator.verify(req.headers.authorization));
            const cashIsOpen = await getOpenCashRegister(authUserData.id);
            if (!cashIsOpen) {
                throw new CashRegisterError("Não é possível inserir movimentação, caixa não está aberto.");
            }
            req.body.cashRegisterId = id;
            const data = CASH_MOVEMENT_VALIDATION.parse(req.body);
            const getCashRegister = await CashRegister.findById(data.cashRegisterId);
            if (!getCashRegister) {
                throw new NotFoundError("ID do caixa é inválido ou não foi localizado")
            }
            const newMovement = new CashRegisterMovements(data);
            const process = await newMovement.save();            
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

}

async function getOpenCashRegister(created_by: string) {
    const cashRegisters = await CashRegister.findOne({
        created_by: new ObjectId(created_by),
        status: 'open'
    });
    return cashRegisters;
}

export {getOpenCashRegister, CashRegisterController};

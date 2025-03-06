import { Request, Response, NextFunction } from "express";
import {IEstablishments, establishmentAttributes, establishmentUpdateValidation } from "../../models/Establishments";
import {z} from "zod";
import ApiResponse from "../../models/base/ApiResponse";
import { idValidation } from "../../utils/defaultValidations";
import { autoInjectable, inject } from "tsyringe";
import IEstablishmentRepository from "../../domain/interfaces/IEstablishmentRepository";

@autoInjectable()
export default class EstablishmentsController {

    constructor(
        @inject("IEstablishmentRepository") private readonly repository : IEstablishmentRepository,
    ) {

    }

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = z.object({
                storeCode: idValidation.optional()
            }).parse(req.query);

            req.result = this.repository.findAll(query.storeCode);
            next();
        } catch (e) {
            next(e);
        }
    }

    findOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);
            
            const establishment = await this.repository.findOne(id);
            
            return ApiResponse.success(establishment).send(res);
        } catch (e) {
            next(e);
        }
    }

    add = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const data = establishmentAttributes.parse(req.body);
            const newEst = await this.repository.add(data as IEstablishments)
            return ApiResponse.success(newEst).send(res);
        } catch (e) {
            next(e);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);            

            const process = await this.repository.delete(id);
            
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    put = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const establishments = establishmentUpdateValidation.parse(req.body);

            const process = await this.repository.update(id, establishments as Partial<IEstablishments>)
            
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

}
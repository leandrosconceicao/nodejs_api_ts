import { autoInjectable, inject } from "tsyringe";
import IPrinterRepository from "../../domain/interfaces/IPrinterRepository";
import { NextFunction, Request, Response } from "express";
import { IPrinters, PRINTER_VALIDATION, SPOOL_VALIDATION } from "../../domain/types/IPrinters";
import ApiResponse from "../../models/base/ApiResponse";
import { idValidation, macAddressValidation } from "../../utils/defaultValidations";
import { z } from "zod";
import { SpoolType } from "../../domain/types/IPrinterSpool";

@autoInjectable()
export default class PrintersController {
    constructor(
        @inject("IPrinterRepository") private readonly repository: IPrinterRepository
    ) {}

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            
            const id = idValidation.parse(req.params.storeCode);

            const query = z.object({
                type: z.nativeEnum(SpoolType).optional()
            }).parse(req.query);

            const printers = await this.repository.findAll(id, query.type)

            return ApiResponse.success(printers).send(res);
        } catch (e) {
            next(e);
        }
    }

    create = async (req: Request, res: Response, next: NextFunction) => {
        try {
            
            const body = PRINTER_VALIDATION
                .transform((value) => {
                    return value as IPrinters
                })
            .parse(req.body);

            const printer = await this.repository.create(body);

            return ApiResponse.success(printer).send(res);

        } catch (e) {
            next(e);
        }
    }

    findOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const printer = await this.repository.findOne(id);

            return ApiResponse.success(printer).send(res);

        } catch (e) {
            next(e);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            await this.repository.delete(id);

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const address = macAddressValidation.parse(req.params.mac);

            const data = z.object({
                name: z.string().min(1).optional(),
                spools: SPOOL_VALIDATION
                    .refine(arr => new Set(arr.map((e) => e.type)).size === arr.length, {
                        message: "Fila de impressão possui itens duplicados"
                    })
                    .optional()
            })
            .transform((obj) => {
                let data : Partial<IPrinters> = {};

                if (obj.name) {
                    data.name = obj.name;
                }

                if (obj.spools?.length) {
                    data.spools = obj.spools.map((e) => ({
                        type: e.type,
                        enabled: e.enabled
                    }))
                }

                return data;
            })
            .parse(req.body)

            await this.repository.update(address, data);

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }
}
import ApiResponse from "../../models/base/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose";
import {AddOneType, addOneValidation, IProductAddOne } from "../../domain/types/IProduct";
import { autoInjectable, inject } from "tsyringe";
import { IAddonesRepository } from "../../domain/interfaces/IAddonesRepository";

var ObjectId = mongoose.Types.ObjectId;


@autoInjectable()
export default class AddOneController {

    constructor(
        @inject('IAddonesRepository') private readonly addoneRepository : IAddonesRepository
    ) {}

    findAll = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = z.object({
                storeCode: idValidation
            }).parse(req.query);

            const process = await this.addoneRepository.findAll(query.storeCode);
            
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    add = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = addOneValidation.parse(req.body);
            const process = await this.addoneRepository.add(body as IProductAddOne);
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = z.string().min(1).uuid().parse(req.params.id);

            const data = z.object({
                name: z.string().min(1).optional(),
                type: z.nativeEnum(AddOneType).optional(),
                maxQtdAllowed: z.number().optional(),
                items: z.array(z.object({
                    name: z.string().min(1),
                    price: z.number().default(0.0)
                })).nonempty().optional()
            })
            .transform((values) => {
                const addOne : {
                    name?: string
                    type?: AddOneType
                    maxQtdAllowed?: number
                    items?: Array<Partial<{
                        name: string,
                        price: number
                    }>>
                } = {};
                
                if (values.name) addOne.name = values.name;

                if (values.type) addOne.type = values.type;

                addOne.maxQtdAllowed = values.maxQtdAllowed ?? null;

                if (values.items) addOne.items = values.items;

                return addOne;
            })
            .parse(req.body);

            const process = await this.addoneRepository.update(id, data);

            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    patch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = z.string().min(1).uuid().parse(req.params.id);

            const obj = z.object({
                movement: z.enum(["push", "pull"], {
                    description: "Opção inválida",
                    required_error: "Movimentação de entrada ou saída é obrigatória"
                }),
                item: z.object({
                    name: z.string().min(1),
                    price: z.number().default(0.0)
                })
            }).parse(req.body);

            await this.addoneRepository.patch(id, obj.movement, obj.item)

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = z.string().min(1).uuid().parse(req.params.id);

            await this.addoneRepository.delete(id);

            return ApiResponse.success(null, 204).send(res);

        } catch (e) {
            next(e);
        }
    }
}
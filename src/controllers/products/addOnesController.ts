
import { AddOnes, AddOneType, addOneValidation } from "../../models/products/AddOnes";
import ApiResponse from "../../models/base/ApiResponse";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose";
import BadRequestError from "../../models/errors/BadRequest";

var ObjectId = mongoose.Types.ObjectId;

export default class AddOneController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = z.object({
                storeCode: idValidation
            }).parse(req.query);

            const process = await AddOnes.find({
                storeCode: new ObjectId(query.storeCode)
            });
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async add(req: Request, res: Response, next: NextFunction) {
        try {
            const newData = new AddOnes(addOneValidation.parse(req.body));
            const process = await newData.save();
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
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

            if (!Object.values(data))  {
                throw new BadRequestError("Nenhum dado de atualização informado");
            }

            const process = await AddOnes.findByIdAndUpdate(id, data);

            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async patch(req: Request, res: Response, next: NextFunction) {
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

            let update = obj.movement === "push" ? {
                $push: { items: obj.item }
            } : {
                $pull: { items: obj.item }
            }

            const process = await AddOnes.updateOne({ _id: id }, update)

            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = z.string().min(1).uuid().parse(req.params.id);

            const process = await AddOnes.findByIdAndDelete(id);
            if (!process) {
                return ApiResponse.badRequest().send(res);
            }
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
}
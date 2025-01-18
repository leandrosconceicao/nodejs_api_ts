import { Validators } from "../../utils/validators";
import { AddOnes, addOneValidation } from "../../models/products/AddOnes";
import ApiResponse from "../../models/base/ApiResponse";
import { Request, Response, NextFunction } from "express";
import InvalidParameter from "../../models/errors/InvalidParameters";
import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose";

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
            const { id, data } = req.body;
            const idVal = new Validators("id", id, "string").validate();
            const dataVal = new Validators("data", data, "object").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            if (!dataVal.isValid) {
                throw new InvalidParameter(dataVal);
            }
            const process = await AddOnes.findByIdAndUpdate(id, data);
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async patch(req: Request, res: Response, next: NextFunction) {
        try {
            const obj = z.object({
                movement: z.enum(["push", "pull"], {
                    description: "Opção inválida",
                    required_error: "Movimentação de entrada ou saída é obrigatória"
                }),
                id: z.string().min(1).uuid(),
                item: addOneValidation
            }).parse(req.body);

            let update = obj.movement === "push" ? {
                $push: { items: obj.item }
            } : {
                $pull: { items: obj.item }
            }

            const process = await AddOnes.updateOne({ _id: obj.id }, update)

            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const { id } = req.body;
            const idVal = new Validators("id", id, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            const process = await AddOnes.findByIdAndDelete(id);
            if (!process.ok) {
                return ApiResponse.badRequest().send(res);
            }
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
}
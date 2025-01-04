import { Validators } from "../../utils/validators";
import AddOnes from "../../models/products/AddOnes";
import ApiResponse from "../../models/base/ApiResponse";
import { Request, Response, NextFunction } from "express";
import InvalidParameter from "../../models/errors/InvalidParameters";
import BadRequestError from "../../models/errors/BadRequest";

// var ObjectId = mongoose.Types.ObjectId;
const moves = ["push", "pull"];

export default class AddOneController {
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const {storeCode} = req.query;
            const storeVal = new Validators("storeCode", storeCode, "string").validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            const process = await AddOnes.find({
                storeCode: storeCode
            });
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }   

    static async add(req: Request, res: Response, next: NextFunction) {
        try {
            const newData = new AddOnes(req.body);
            const process = await newData.save();
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const {id, data} = req.body;
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
            const {movement, id, item} = req.body;
            if (moves.includes(movement)) {
                throw new BadRequestError("movement")
            }
            const idVal = new Validators("id", id, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            const itemVal = new Validators("item", item, "object").validate();
            if (!itemVal.isValid) {
                throw new InvalidParameter(itemVal);
            }
            let update = movement === "push" ? {
                $push: {items: item}
            } : {
                $pull: {items: item}
            }
            const process = await AddOnes.findByIdAndUpdate(id, {
                update
            })
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const {id} = req.body;
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
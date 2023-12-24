import { Request, Response, NextFunction } from "express";
import { Validators } from "../../utils/validators";
import Establishments from "../../models/Establishments";
import { Query } from "mongoose";
import NotFoundError from "../../models/errors/NotFound";
import ApiResponse from "../../models/base/ApiResponse";
import InvalidParameter from "../../models/errors/InvalidParameters";
import establishmentDataCheck from "./establishmentDataCheck";

export default class EstablishmentsController {

    static async findAll(req: Request, res: Response, next: NextFunction) {
        interface establishmentQuery {
            _id?: string
        }
        try {
            let { id } = req.query;
            let myQuery: establishmentQuery = {};
            const idValidation = new Validators("id", id, "string").validate();
            if (idValidation.isValid) {
                myQuery._id = `${id}`;
            }
            req.result = Establishments.find(myQuery).select({ ownerId: 0 });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const establishment = await Establishments.findById(id);
            if (!establishment) {
                throw new NotFoundError();
            }
            return ApiResponse.success(establishment).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async add(req: Request, res: Response, next: NextFunction) {
        try {
            const newEst = new Establishments(req.body);
            await newEst.save();
            return ApiResponse.success(newEst).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.body.id as string;
            const idValidation = new Validators("id", id, "string").validate();
            if (!idValidation.isValid) {
                throw new InvalidParameter(idValidation);
            }
            const checks = await establishmentDataCheck.check(id);
            if (!checks) {
                return ApiResponse.badRequest("Estabelecimento possui informações vinculadas, não é possível excluir.").send(res);
            }
            const process = await Establishments.findByIdAndDelete(id);
            return ApiResponse.success(process.value).send(res);
        } catch (e) {
            next(e);
        }
    }
}
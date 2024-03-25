import { Request, Response, NextFunction } from "express";
import { Validators } from "../../utils/validators";
import {Establishments, establishmentAttributes } from "../../models/Establishments";
import {z} from "zod";
import NotFoundError from "../../models/errors/NotFound";
import ApiResponse from "../../models/base/ApiResponse";
import InvalidParameter from "../../models/errors/InvalidParameters";
import establishmentDataCheck from "./establishmentDataCheck";
import FirebaseStorage from "../../utils/firebase/storage";
import fs from "fs/promises";


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
            z.string().min(24).max(24).parse(id);
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
            const newEst = new Establishments(establishmentAttributes.parse(req.body));
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

    static async put(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            z.string().min(24).max(24).parse(id);
            const establishments = establishmentAttributes.parse(req.body);
            const process = await Establishments.findByIdAndUpdate(id, establishments, {
                new: true
            });
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async updateLogo(req: Request, res: Response, next: NextFunction) {
        try {
            const id = z.string().min(24).max(24).parse(req.params.id);
            const data = z.object({
                path: z.string().min(1),
                data: z.string().min(1),
            }).strict().parse(req.body);
            const fireSrv = new FirebaseStorage();
            const imageLink = await fireSrv.uploadFile(data);
            const process = await Establishments.findByIdAndUpdate(id, {
                logo: imageLink
            }, {new: true});
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
}
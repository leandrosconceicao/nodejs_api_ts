import Apps from "../../models/Apps";
import {z} from "zod";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound";
import { idValidation } from "../../utils/defaultValidations";
import { RegexBuilder } from "../../utils/regexBuilder";

interface QuerySearch {
    _id?: string,
    appsName?: string | RegExp,
    version?: string,
}

const appValidation = z.object({
    appsName: z.string().min(1),
    version: z.string().min(1),
    releaseDate: z.string().datetime({offset: true})
});

export default class AppsController {
    
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const query = z.object({
                id: idValidation.optional(),
                name: z.string().optional(),
                version: z.string().optional(),
            }).optional().transform((value) => {
                let query = <QuerySearch>{};
                if (value.id) {
                    query._id = value.id;
                }
                if (value.name) {
                    query.appsName = RegexBuilder.searchByName(value.name);
                }
                if (value.version) {
                    query.version = value.version;
                }
                return query;
            }).parse(req.query);
            req.result = Apps.find(query);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            let id = req.params.id;
            const data = await Apps.findById(id);
            if (!data) {
                throw new NotFoundError("App não localizado");
            }
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async add(req: Request, res: Response, next: NextFunction) {
        try {
            const body = appValidation.parse(req.body);
            const app = new Apps(body);
            await app.save();
            return ApiResponse.success(null, 204).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const data = appValidation.parse(req.body);
            const dt = await Apps.findByIdAndUpdate(id, {$set: data});
            return ApiResponse.success(dt).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id)
            const process = await Apps.findByIdAndDelete(id);
            if (!process) {
                return ApiResponse.badRequest().send(res);
            }
            return ApiResponse.success(process, 204).send(res);
        } catch (e) {   
            next(e);
        }
    }

    static async validateVersion(req: Request, res: Response, next: NextFunction) {
        try {
            const searchApp = z.object({
                name: z.string().min(1),
                version: z.string().min(1)
            }).parse(req.query);
            const app = await Apps.findOne({
                appsName: searchApp.name,
            });
            if (!app) {
                throw new NotFoundError("App não localizado");
            }
            const versionCheck = parseInt(searchApp.version.replaceAll(".", ""));
            const serverVersion = parseInt(app.version.replaceAll(".", ""));
            const hasNewVersion =  serverVersion > versionCheck;
            if (hasNewVersion) {
                return ApiResponse.badRequest("Há uma nova versão do aplivativo disponível para atualização").send(res);
            }
            return ApiResponse.success(app).send(res);
        } catch (e) {
            next(e);
        }
    }
}
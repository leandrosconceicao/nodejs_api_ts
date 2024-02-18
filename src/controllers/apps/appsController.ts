import Apps from "../../models/Apps.js";
import { isValidObjectId } from "mongoose";
import { Validators } from "../../utils/validators";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound.js";
import InvalidParameter from "../../models/errors/InvalidParameters.js";

interface QuerySearch {
    _id?: string,
    appsName?: string,
    version?: string,
}

export default class AppsController {
    
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            let body = req.query;
            let query: QuerySearch = {};
            const idVal = new Validators("id", body.id, "string").validate();
            const appVal = new Validators("name", body.name, "string").validate();
            const verVal = new Validators("version", body.version, "string").validate();
            if (idVal.isValid) {
                query._id = body.id as string;
            }
            if (appVal.isValid) {
                query.appsName = body.name as string;
            }
            if (verVal.isValid) {
                query.version = body.version as string;
            }
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
            let body = req.body;
            const app = new Apps(body);
            await app.save();
            return ApiResponse.success().send(res);
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
            delete data._id;
            const dt = await Apps.findByIdAndUpdate(id, {$set: data});
            return ApiResponse.success(dt).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            let id = req.body.id;
            const idVal = new Validators("id", id, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            const process = await Apps.findByIdAndDelete(id);
            if (!process) {
                return ApiResponse.badRequest().send(res);
            }
            return ApiResponse.success(process).send(res);
        } catch (e) {   
            next(e);
        }
    }

    static async validateVersion(req: Request, res: Response, next: NextFunction) {
        try {
            const {appName, version} = req.query;
            const appVal = new Validators("name", appName, "string").validate();
            const verVal = new Validators("version", version, "string").validate();
            if (!appVal.isValid) {
                throw new InvalidParameter(appVal);
            }
            if (!verVal.isValid) {
                throw new InvalidParameter(verVal);
            }
            const app = await Apps.findOne({
                appsName: appName,
            });
            if (!app) {
                throw new NotFoundError("App não localizado");
            }
            const versionCheck = parseInt(version.toString().replace(".", ""));
            const serverVersion = parseInt(app.version.toString().replace(".", ""));
            const hasNewVersion =  serverVersion > versionCheck;
            if (hasNewVersion) {
                return ApiResponse.badRequest("Há uma nova versão do aplivativo disponível para atualização").send(res);
            }
            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }
}
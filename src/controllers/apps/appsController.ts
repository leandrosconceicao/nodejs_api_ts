import Apps from "../../models/Apps";
import {z} from "zod";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound";
import { idValidation } from "../../utils/defaultValidations";
import { RegexBuilder } from "../../utils/regexBuilder";
import { appValidation, IApp, QuerySearch } from "../../domain/types/IApp";
import { autoInjectable, inject } from "tsyringe";
import IAppRepository from "../../domain/interfaces/IAppRepository";

@autoInjectable()
export default class AppsController {

    constructor(
        @inject('IAppRepository') private readonly appRepository: IAppRepository
    ) {}
    
    findAll = async (req: Request, _: Response, next: NextFunction) => {
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
            req.result = this.appRepository.findAll(query);
            next();
        } catch (e) {
            next(e);
        }
    }

    findOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let id = req.params.id;
            
            const data = await this.appRepository.findOne(id);
            
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }

    add = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = appValidation.parse(req.body);
            
            const app = await this.appRepository.add(body as IApp);

            return ApiResponse.success(app, 201).send(res);
        } catch (e) {
            next(e);
        }
    }

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);
            
            const data = appValidation.parse(req.body);
            
            const dt = await this.appRepository.update(id, data);

            return ApiResponse.success(dt).send(res);
        } catch (e) {
            next(e);
        }
    }

    delete = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id)
            
            const process = await this.appRepository.delete(id);

            return ApiResponse.success(process, 204).send(res);

        } catch (e) {   
            next(e);
        }
    }

    validateVersion = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const searchApp = z.object({
                name: z.string().min(1),
                version: z.string().min(1)
            }).parse(req.query);

            const app = await this.appRepository.validateVersion(
                searchApp.name, 
                parseInt(searchApp.version.replaceAll(".", ""))
            )

            return ApiResponse.success(app).send(res);
        } catch (e) {
            next(e);
        }
    }
}
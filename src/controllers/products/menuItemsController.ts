import {z} from "zod";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import { autoInjectable, inject } from "tsyringe";
import ICategoryRepository from "../../domain/interfaces/ICategoryRepository";
import { idValidation } from "../../utils/defaultValidations";
@autoInjectable()
export default class MenuItemsController {

    constructor(
        @inject("ICategoryRepository") private readonly categoryRepository : ICategoryRepository
    ) {}

    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const storeCode = idValidation.parse(req.params.storeCode);

            const data = await this.categoryRepository.getMenuItems(storeCode);

            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
}
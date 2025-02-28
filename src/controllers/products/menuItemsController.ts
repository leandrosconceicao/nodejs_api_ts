import {z} from "zod";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import { autoInjectable, inject } from "tsyringe";
import ICategoryRepository from "../../domain/interfaces/ICategoryRepository";
@autoInjectable()
export default class MenuItemsController {

    constructor(
        @inject("ICategoryRepository") private readonly categoryRepository : ICategoryRepository
    ) {}

    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const query = z.object({
                storeCode: z.string().min(1).max(24)
            }).parse(req.query);

            const data = await this.categoryRepository.getMenuItems(query.storeCode);

            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
}
import { NextFunction, Request, Response } from "express";
import { autoInjectable, inject } from "tsyringe";
import ApiResponse from "../../../models/base/ApiResponse";
import { IProductHandler } from "../../../domain/interfaces/IProductHandler";

@autoInjectable()
export default class ProductImageController {

    constructor(
        @inject("IProductHandler") private readonly handler : IProductHandler,
    ) {}

    add = async (req: Request, res: Response, next: NextFunction) => {
        try {
            
            await this.handler.addProductImage(req.params.storeCode, req.params.productId, req.file);

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    remove = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.handler.deleteProductImage(req.params.storeCode, req.params.productId, req.body);

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    patch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.handler.setThumbnail(req.params.storeCode, req.params.productId, req.body);

            return ApiResponse.success().send(res);

        } catch (e) {
            next(e);
        }
    }
}
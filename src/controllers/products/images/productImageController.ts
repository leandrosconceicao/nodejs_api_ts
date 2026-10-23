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

            if (!req.file) {
                return ApiResponse.badRequest("Necessário enviar o arquivo").send(res);
            }
            
            await this.handler.addProductImage(req.params.storeCode.toString(), req.params.productId.toString(), req.file);

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    remove = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.handler.deleteProductImage(req.params.storeCode.toString(), req.params.productId.toString(), req.body);

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    patch = async (req: Request, res: Response, next: NextFunction) => {
        try {
            await this.handler.setThumbnail(req.params.storeCode.toString(), req.params.productId.toString(), req.body);

            return ApiResponse.success().send(res);

        } catch (e) {
            next(e);
        }
    }
}
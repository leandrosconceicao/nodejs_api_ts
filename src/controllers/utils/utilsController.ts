import { autoInjectable, inject } from "tsyringe";
import { IUtilities } from "../../domain/interfaces/IUtilities";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";
import ApiResponse from "../../models/base/ApiResponse";

@autoInjectable()
export class UtilsController {

    constructor(
        @inject("IUtilities") private readonly utilities: IUtilities
    ) {}

    generateQrcode = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = z.object({
                value: z.string()
            }).parse(req.body)

            const qrcode = await this.utilities.generateQrCode(body.value);

            return ApiResponse.success({
                qrcode: qrcode.toString("base64")
            }).send(res);
        } catch (e) {
            next(e);
        }
    }
}
import { Request, Response, NextFunction } from "express";
import {Establishments, establishmentAttributes } from "../../models/Establishments";
import {z} from "zod";
import NotFoundError from "../../models/errors/NotFound";
import ApiResponse from "../../models/base/ApiResponse";
import establishmentDataCheck from "./establishmentDataCheck";
import FirebaseStorage from "../../utils/firebase/storage";
import updateRemoteConfig from "../../utils/firebase/remoteConfig";
import { idValidation } from "../../utils/defaultValidations";
import mongoose from "mongoose";
import TokenGenerator from "../../utils/tokenGenerator";
import { Users } from "../../models/Users";
import UnauthorizedError from "../../models/errors/UnauthorizedError";

var ObjectId = mongoose.Types.ObjectId;


export default class EstablishmentsController {

    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            let myQuery: {
                _id?: string
            };
            z.object({
                storeCode: idValidation.optional()
            }).transform((val) => {
                if (val.storeCode) {
                    myQuery._id = val.storeCode
                }
            })
            .parse(req.query);
            req.result = Establishments.find(myQuery).select({ ownerId: 0 });
            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
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
            const id = idValidation.parse(req.params.id);

            const authUserData = z.object({
                id: idValidation
            }).parse(TokenGenerator.verify(req.headers.authorization));
        
            const updatedBy = await Users.findById(authUserData.id);
    
            if (!updatedBy) {
                throw new NotFoundError("Usuário é inválido ou não foi localizado");
            }

            if (updatedBy.group_user !== "99")
                throw new UnauthorizedError();

            const checks = await establishmentDataCheck.check(id);
            if (checks) {
                return ApiResponse.badRequest("Estabelecimento possui informações vinculadas, não é possível excluir.").send(res);
            }
            const process = await Establishments.findOneAndUpdate({
                _id: new ObjectId(id)
            }, {
                $set: {
                    deleted: true
                }
            });

            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async put(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const establishments = establishmentAttributes.parse(req.body);
            if (establishments.dataImage) {
                establishments.logo = await updateLogo({
                    data: establishments.dataImage.data,
                    path: `assets/${id}/${establishments.dataImage.path}`
                });
            }
            const process = await Establishments.findByIdAndUpdate(id, establishments, {
                new: true
            });
            if (establishments.services?.customer_service?.enabled !== undefined) {
                updateRemoteConfig(id, "isOpen", `${establishments.services?.customer_service?.enabled}`);
            }
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async checkOpening(establishmentId: any, orderType: string) {
        const establishment = await Establishments.findById(establishmentId);
        if (!establishment.services.customer_service.enabled) {
            throw ApiResponse.badRequest("Estabelecimento não está aberto no momento.");
        }
        if (orderType === "delivery") {
            if (!establishment.services.delivery.enabled) {
                throw ApiResponse.badRequest("Serviço de delivery não está disponível no momento.");
            }
        }
        if (orderType === "withdraw") {
            if (!establishment.services.withdraw.enabled) {
                throw ApiResponse.badRequest("Serviço de retira não está disponível no momento.");
            }
        }
    }

}
async function updateLogo(data: {
    path?: string;
    data?: string;
}) {
    const fireSrv = new FirebaseStorage();
    return fireSrv.uploadFile(data);
}
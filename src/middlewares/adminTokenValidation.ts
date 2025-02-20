import { z } from "zod";
import NotFoundError from "../models/errors/NotFound";
import UnauthorizedError from "../models/errors/UnauthorizedError";
import { Users } from "../models/Users";
import { idValidation } from "../utils/defaultValidations";
import TokenGenerator from "../utils/tokenGenerator";
import express, { NextFunction } from "express";
import ForbiddenAcessError from "../domain/exceptions/ForbiddenAcessError";

export default async (req: express.Request, res: express.Response, next: NextFunction) => {
    try {
        const authUserData = z.object({
            id: idValidation,
            group_user: z.string().optional()
        }).parse(TokenGenerator.verify(req.headers.authorization));
    
        const updatedBy = await Users.findById(authUserData.id);

        if (!updatedBy)
            throw new NotFoundError("Usuário é inválido ou não foi localizado");

        if (!updatedBy.isActive)
            throw new ForbiddenAcessError("Usuário não está ativo")

        if (authUserData.group_user !== "99" && authUserData.group_user !== "1")
            throw new UnauthorizedError();

        req.autenticatedUser = updatedBy;
        
        next();
    } catch (e) {
        next(e);
    }
}
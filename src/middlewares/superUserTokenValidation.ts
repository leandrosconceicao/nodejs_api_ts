import { z } from "zod";
import TokenGenerator from "../utils/tokenGenerator";
import express, { NextFunction } from "express";
import { idValidation } from "../utils/defaultValidations";
import { Users } from "../models/Users";
import NotFoundError from "../models/errors/NotFound";
import UnauthorizedError from "../models/errors/UnauthorizedError";

export default async (req: express.Request, res: express.Response, next: NextFunction) => {
    try {
        const authUserData = z.object({
            id: idValidation,
            group_user: z.string().optional()
        }).parse(TokenGenerator.verify(req.headers.authorization));
    
        const updatedBy = await Users.findById(authUserData.id);

        if (!updatedBy)
            throw new NotFoundError("Usuário é inválido ou não foi localizado");

        if (authUserData.group_user !== "99")
            throw new UnauthorizedError();

        next();
    } catch (e) {
        next(e);
    }
}
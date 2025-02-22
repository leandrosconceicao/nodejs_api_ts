import { z } from "zod";
import { idValidation } from "../utils/defaultValidations";
import TokenGenerator from "../utils/tokenGenerator";
import express, { NextFunction } from "express";
import { autoInjectable, inject } from "tsyringe";
import IUserRepository from "../domain/interfaces/IUserRepository";
import NotFoundError from "../models/errors/NotFound";
import ForbiddenAcessError from "../domain/exceptions/ForbiddenAcessError";
import UnauthorizedError from "../models/errors/UnauthorizedError";
import { IUsers } from "../models/Users";

@autoInjectable()
export class TokenController {

    constructor(
        @inject("IUserRepository") private readonly userRepository : IUserRepository
    ) {}
    
    userValidation = async (req: express.Request, _: express.Response, next: NextFunction) => {
        try {
            
            req.autenticatedUser = await this.validateUser(req.headers.authorization);
                
            next();
        } catch (e) {
            next(e);
        }
    }

    superUserValidation = async (req: express.Request, res: express.Response, next: NextFunction) => {
        try {

            const authUserData = await this.validateUser(req.headers.authorization);
    
            if (authUserData.group_user !== "99")
                throw new UnauthorizedError();
    
            next();
        } catch (e) {
            next(e);
        }
    }

    adminValidation = async (req: express.Request, res: express.Response, next: NextFunction) => {
        try {
            const authUserData = await this.validateUser(req.headers.authorization);
    
            if (authUserData.group_user !== "99" && authUserData.group_user !== "1")
                throw new UnauthorizedError();
    
            req.autenticatedUser = authUserData;
            
            next();
        } catch (e) {
            next(e);
        }
    }

    private validateUser = async (authorization: string) : Promise<IUsers> => {
        const authUserData = z.object({
            id: idValidation,
            group_user: z.string().optional()
        }).parse(TokenGenerator.verify(authorization));

        const user = await this.userRepository.findOne(authUserData.id);

        if (!user)
            throw new NotFoundError('Usuário não localizado')

        if (!user.isActive)
            throw new ForbiddenAcessError("Usuário não está ativo")

        return user;
    }
}
export default (req: express.Request, res: express.Response, next: NextFunction) => {
    try {
        TokenGenerator.verify(req.headers.authorization);
        next();
    } catch (e) {
        next(e);
    }
}
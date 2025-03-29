import {IUsers, IUserSearchQuery, userPatchValidation, Users, userValidaton} from "../../models/Users";
import { z } from "zod";
import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;
import { NextFunction, Request, Response } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import PassGenerator from "../../utils/passGenerator";
import NotFoundError from "../../models/errors/NotFound";
import TokenGenerator from "../../utils/tokenGenerator";
import { booleanStringValidation, idValidation } from "../../utils/defaultValidations";
import { DELETED_SEARCH } from "../../models/base/MongoDBFilters";
import { RegexBuilder } from "../../utils/regexBuilder";
import UnauthorizedError from "../../models/errors/UnauthorizedError";
import ForbiddenAcessError from "../../domain/exceptions/ForbiddenAcessError";
import { autoInjectable, inject } from "tsyringe";
import IUserRepository from "../../domain/interfaces/IUserRepository";
import BadRequestError from "../../models/errors/BadRequest";
// import admin from "../../../config/firebaseConfig.js"

// const FIREBASEAUTH = admin.auth();

@autoInjectable()
class UserController {

  constructor(
    @inject("IUserRepository") private readonly userRepository : IUserRepository
  ) {}

  add = async (req: Request, res: Response, next: Function) => {
    try {

      const data = userValidaton.parse(req.body);

      const users = await this.userRepository.addUser(data as IUsers);

      return ApiResponse.success(users, 201).send(res);
    } catch (e) {
      next(e);
    }
  }

  delete = async (req: Request, res: Response, next: Function) => {
    try {
      const id = idValidation.parse(req.params.id);
      
      const process = await this.userRepository.delete(id, req.autenticatedUser.id)

      return ApiResponse.success(process).send(res);

    } catch (e) {
      next(e);
    }
  }

  patch = async (req: Request, res: Response, next: Function) => {
    try {
      const id = idValidation.parse(req.params.id);
      const user = userPatchValidation
      .transform((values) => {
        if (values.pass) {
          values.pass = new PassGenerator(values.pass).build();
        }
        if (values.changePassword) {
          values.pass = new PassGenerator("12345678").build();
        }
        return values;
      })  
      .parse(req.body);
      
      const updatedUser = await this.userRepository.updateUser(id, user as IUsers);

      return ApiResponse.success(updatedUser).send(res);
    } catch (e) {
      next(e);
    }
  }

  updateUserData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const id = idValidation.parse(req.params.id);

      const data = z.object({
        username: z.string().min(1).optional(),
        newPass: z.string().min(1).optional(),
        confirmationPass: z.string().min(1).optional(),
      })
      .parse(req.body);

      const user = await this.userRepository.findOne(id)

      
      if (data.confirmationPass && user.pass !== new PassGenerator(data.confirmationPass).build())
        throw new BadRequestError("Senha atual é inválida");
      
      let userUpdate : Partial<IUsers> = {};

      if (data.username) userUpdate.username = data.username;
      if (data.newPass) userUpdate.pass = new PassGenerator(data.newPass).build();

      if (!Object.values(userUpdate).length) 
        throw new BadRequestError("Nenhum dado foi informado")

      const userUpdated = await this.userRepository.updateUser(id, userUpdate)

      ApiResponse.success(userUpdated).send(res);
    } catch (e) {
      next(e);
    }
  }

  findOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const id = idValidation.parse(req.params.id);

      const user = await this.userRepository.findOne(id);
      
      return ApiResponse.success(user).send(res);

    } catch (e) {
      next(e);
    }
  }

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    
    try {

      const query: IUserSearchQuery = {};
      
      z.object({
        storeCode: idValidation.optional(),
        group_user: z.string().min(1).optional(),
        username: z.string().min(1).optional(),
        email: z.string().min(1).optional(),
        isActive: booleanStringValidation.optional()
      }).transform((data) => {
        query.deleted = DELETED_SEARCH;
        if (data.storeCode) {
          query.storeCode = new ObjectId(data.storeCode)
        }
        if (data.group_user) {
          query.group_user = data.group_user;
        }
        
        if (data.username) {
          query.username = RegexBuilder.searchByName(data.username);
        }
        if (data.isActive !== undefined) {
          query.isActive = data.isActive;
        }

        if (data.email) {
          query.email = data.email;
        }
      }).parse(req.query);
      
      req.result = this.userRepository.findAll(query);

      next();
    } catch (e) {
      next(e);
    }
  }

  authenticate = async (req: Request, res: Response, next: NextFunction) => {
    
    try {
      const body = z.object({
        email: z.string().min(1),
        password: z.string().min(1),
        firebaseToken: z.string().optional(),
      }).parse(req.body);

      const users = await this.userRepository.autenticateUser(body.email, new PassGenerator(body.password).build());

      const authToken = TokenGenerator.generate(users);

      res.set("Authorization", authToken);
      res.set("Access-Control-Expose-Headers", "*");

      if (body.firebaseToken && users.token != body.firebaseToken) {
        this.userRepository.updateUserToken(users.id, body.firebaseToken);
      }
      return ApiResponse.success(users).send(res);
    } catch (e) {
      next(e);
    }
  }

  updatePass = async (req: Request, res: Response, next: Function) => {
    try {
      const id = idValidation.parse(req.params.id);
      const data = z.object({
        activePassword: z.string().min(1),
        newPassword: z.string().min(1)
      }).parse(req.body);
      
      await this.userRepository.updateUserPassword(id, data.activePassword, data.newPassword);
      
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }
}

async function checkIfUserExists(id: string) {
  const queryId = idValidation.parse(id);
  const user = await Users.findById(queryId);
  if (!user) {
    throw new NotFoundError("Usuário não localizado");
  }
}

export {UserController, checkIfUserExists}

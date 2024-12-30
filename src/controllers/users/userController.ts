import {userPatchValidation, Users, userValidaton} from "../../models/Users";
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
// import admin from "../../../config/firebaseConfig.js"

// const FIREBASEAUTH = admin.auth();

class UserController {
  static async add(req: Request, res: Response, next: Function) {
    try {
      const data = userValidaton.parse(req.body);
      const user = new Users(data);
      const users = await user.save();
      return ApiResponse.success(users, 201).send(res);
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: Function) {
    try {
      const id = z.string().min(1).parse(req.params.id);
      const authUserData = z.object({
        id: idValidation
      }).parse(TokenGenerator.verify(req.headers.authorization));
      const process = await Users.findOneAndUpdate({
        _id: new ObjectId(id)
      }, {
        $set: {
          deleted: true,
          updatedBy: new ObjectId(authUserData.id),
        }
      }, {
        new: true
      }).lean();
      return ApiResponse.success(process).send(res);
    } catch (e) {
      next(e);
    }
  }

  static async patch(req: Request, res: Response, next: Function) {
    try {
      const id = idValidation.parse(req.params.id);
      const user = userPatchValidation.parse(req.body);
      if (user.pass) {
        user.pass = new PassGenerator(user.pass).build();
      }
      if (user.changePassword) {
        user.pass = new PassGenerator("12345678").build();
      }
      const updatedUser = await Users.findByIdAndUpdate(id, user, { new: true });
      return ApiResponse.success(updatedUser).send(res);
    } catch (e) {
      next(e);
    }
  }

  static async updatePass(req: Request, res: Response, next: Function) {
    try {
      const id = idValidation.parse(req.params.id);
      const data = z.object({
        activePassword: z.string().min(1),
        newPassword: z.string().min(1)
      }).parse(req.body);
      const updateProcess = await Users.updateOne({
        _id: id,
        pass: new PassGenerator(data.activePassword).build()
      }, {
        pass: new PassGenerator(data.newPassword).build()
      });
      if (updateProcess.modifiedCount== 0) {
        throw ApiResponse.unauthorized("Usuário inválido ou credenciais inválidas");
      }
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }

  static async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = idValidation.parse(req.params.id);
      const user = await Users.findOne({
        _id: new ObjectId(id)
      });
      if (!user) {
        throw new NotFoundError("Usuário não localizado");
      }
      return ApiResponse.success(user).send(res);
    } catch (e) {
      next(e);
    }
  }

  static async findAll(req: Request, res: Response, next: NextFunction) {
    interface searchQuery {
      storeCode?: string,
      establishments?: Object,
      group_user?: string,
      username?: string,
      deleted?: any,
      isActive?: boolean
    }
    try {
      const query: searchQuery = {};
      
      z.object({
        storeCode: idValidation.optional(),
        group_user: z.string().min(1).optional(),
        username: z.string().min(1).optional(),
        isActive: booleanStringValidation.optional()
      }).transform((data) => {
        query.deleted = DELETED_SEARCH;
        if (data.storeCode) {
          query.establishments = {
            $in: [new ObjectId(data.storeCode)]
          }
        }
        if (data.group_user) {
          query.group_user = data.group_user;
        }
        
        if (data.username) {
          query.username = data.username;
        }
        if (data.isActive !== undefined) {
          query.isActive = data.isActive;
        }
      }).parse(req.query);
      
      req.result = Users.find(query).select({
        pass: 0
      }).populate("establishments");
      next();
    } catch (e) {
      next(e);
    }
  }

  static async authenticate(req: Request, res: Response, next: NextFunction) {
    
    try {
      const body = z.object({
        email: z.string().min(1),
        password: z.string().min(1),
        firebaseToken: z.string().optional(),
      }).parse(req.body);
      const hashPass = new PassGenerator(body.password).build();
      const users = await Users.findOne({
        email: body.email,
        pass: hashPass,
      }).select({
        pass: 0
      }).populate("establishments");
      if (!users) {
        throw new NotFoundError("Dados incorretos ou inválidos.")
      }
      const authToken = TokenGenerator.generate(users.id);
      res.set("Authorization", authToken);
      res.set("Access-Control-Expose-Headers", "*");
      if (body.firebaseToken && users.token != body.firebaseToken) {
        updateUserToken(users.id, body.firebaseToken);
      }
      return ApiResponse.success(users).send(res);
    } catch (e) {
      next(e);
    }
  }
}

async function updateUserToken(id: string, token: string) {
  try {
    await Users.findByIdAndUpdate(id, {
      "token": token
    });
  } catch (_) {

  }
}

async function checkIfUserExists(id: string) {
  const queryId = idValidation.parse(id);
  const user = await Users.findById(queryId);
  if (!user) {
    throw new NotFoundError("Usuário não localizado");
  }
}

export {UserController, updateUserToken, checkIfUserExists}

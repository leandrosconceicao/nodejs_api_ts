import {userPatchValidation, Users, userValidaton} from "../../models/Users";
import { z } from "zod";
import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;
import { NextFunction, Request, Response } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import PassGenerator from "../../utils/passGenerator";
import { Validators } from "../../utils/validators";
import NotFoundError from "../../models/errors/NotFound";
import TokenGenerator from "../../utils/tokenGenerator";
import { idValidation } from "../../utils/defaultValidations";
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
    }
    try {
      const searchQuery = z.object({
        storeCode: idValidation.optional(),
        group_user: z.string().min(1).optional(),
        username: z.string().min(1).optional(),
      }).parse(req.query);
      
      const query: searchQuery = {};
      query.deleted = DELETED_SEARCH;
      if (searchQuery.storeCode) {
        query.establishments = {
          $in: [new ObjectId(searchQuery.storeCode)]
        }
      }
      if (searchQuery.group_user) {
        query.group_user = searchQuery.group_user;
      }
      
      if (searchQuery.username) {
        query.username = searchQuery.username;
      }
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
        token: z.string().optional(),
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
      if (body.token && users.token != body.token) {
        updateUserToken(users.id, body.token);
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

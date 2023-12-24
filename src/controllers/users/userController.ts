import Users from "../../models/Users";
import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;
import { NextFunction, Request, Response } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import InvalidParameters from "../../models/errors/InvalidParameters";
import PassGenerator from "../../utils/passGenerator";
import { Validators } from "../../utils/validators";
import NotFoundError from "../../models/errors/NotFound";
import TokenGenerator from "../../utils/tokenGenerator";
// import admin from "../../../config/firebaseConfig.js"

// const FIREBASEAUTH = admin.auth();

export default class UserController {
  static async add(req: Request, res: Response, next: Function) {
    try {
      let user = new Users(req.body);
      user.pass = new PassGenerator(user.pass).build();
      // let firebaseCreation = await FIREBASEAUTH.createUser({
      //   email: user.email,
      //   password: user.pass,
      //   displayName: user.username,
      // })
      const users = await user.save();
      return ApiResponse.success(users, 201).send(res);
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: Function) {
    try {
      let id: string = req.body.id;
      const idValidation = new Validators("id", id, "string").validate();
      if (!idValidation.isValid) {
        throw new InvalidParameters(idValidation);
      }
      const process = await Users.findByIdAndDelete(id);
      return ApiResponse.success(process).send(res);
    } catch (e) {
      next(e);
    }
  }

  static async update(req: Request, res: Response, next: Function) {
    // interface userUpdate {
    //   isActive?: boolean,
    //   group_user?: string,
    //   username?: string,
    //   establishments? : Array<string>
    // }
    try {
      const {id, data} = req.body;
      const idValidation = new Validators("id", id, "string").validate();
      const dataValidation = new Validators("data", data, "object").validate();
      if (!idValidation.isValid) {
        throw new InvalidParameters(idValidation);
      }
      if (!dataValidation.isValid) {
        throw new InvalidParameters(dataValidation);
      }
      await Users.findByIdAndUpdate(id, {
        isActive: data.isActive,
        group_user: data.group_user,
        username: data.username,
        establishments: data.establishments
      });
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }

  static async updatePass(req: Request, res: Response, next: Function) {
    try {
      const {activePassword, id, pass} = req.body;
      const actPassValidation = new Validators("activePassword", activePassword, "string").validate();
      const idValidation = new Validators("id", id, "string").validate();
      const passValidation = new Validators("pass", pass).validate();
      if (!passValidation.isValid) {
        throw new InvalidParameters(passValidation);
      }
      if (!idValidation.isValid) {
        throw new InvalidParameters(idValidation);
      }
      if (!actPassValidation.isValid) {
        throw new InvalidParameters(actPassValidation);
      }
      const activePass = new PassGenerator(activePassword).build();
      const user = await Users.findOne({
        _id: new ObjectId(id),
        pass: activePass
      }).lean();
      if (!user) {
        throw new NotFoundError("Dados inválidos ou incorretos.");
      }
      await Users.findByIdAndUpdate(id, {
        pass: new PassGenerator(pass).build()
      });
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }

  static async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const idValidation = new Validators("id", id).validate();
      if (!idValidation.isValid) {
        throw new InvalidParameters(idValidation);
      }
      const user = await Users.findById(id);
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
      username?: string
    }
    try {
      const { storeCode, group_user, username } = <searchQuery>req.query;

      const query: searchQuery = {};
      // FIREBASEAUTH.getUsers().then((e) => console.log(e));
      const storeValidation = new Validators("storeCode", storeCode).validate();
      if (storeValidation.isValid) {
        query.establishments = {
          $in: [new ObjectId(storeCode)]
        }
      }
      const groupValidation = new Validators("group_user", group_user).validate();
      if (groupValidation.isValid) {
        query.group_user = group_user;
      }
      const usernameValidation = new Validators("username", username).validate();
      if (usernameValidation.isValid) {
        query.username = username;
      }
      // const users = 
      req.result = Users.find(query).select({
        pass: 0
      }).populate("establishments");
      // return ApiResponse.success(users).send(res);
      next();
    } catch (e) {
      next(e);
    }
  }

  static async authenticate(req: Request, res: Response, next: NextFunction) {
    interface AuthForm {
      email?: string,
      password?: string,
      token?: string,
    }
    try {
      const { email, password, token } = <AuthForm>req.body;
      const emailValidation = new Validators("email", email, 'string').validate();
      const passwordValidation = new Validators("password", password, 'string').validate();
      if (!emailValidation.isValid) {
        throw new InvalidParameters(emailValidation);
      }
      if (!passwordValidation.isValid) {
        throw new InvalidParameters(passwordValidation);
      }
      const hashPass = new PassGenerator(password).build();
      let users = await Users.findOne({
        email: email,
        pass: hashPass,
      }).select({
        pass: 0
      }).populate("establishments");
      if (!users) {
        throw new NotFoundError("Dados incorretos ou inválidos.")
      } else {
        const authToken = TokenGenerator.generate(email);
        res.set("Authorization", authToken);
        res.set("Access-Control-Expose-Headers", "*");
        if (token && users.token != token) {
          await updateUserToken(users.id, token)
        }
        return ApiResponse.success(users).send(res);
      }
    } catch (e) {
      next(e);
    }
  }
}

async function updateUserToken(id: string, token: string) {
  await Users.findByIdAndUpdate(id, {
    "token": token
  })
}

// export default UserController;

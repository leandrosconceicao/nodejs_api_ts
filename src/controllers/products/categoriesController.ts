import mongoose from "mongoose";
import { Validators } from "../../utils/validators";
import Category from "../../models/Categories";
import ApiResponse from "../../models/base/ApiResponse";
import ProductController from "./productController";
import {Request, Response, NextFunction } from "express";
import { RegexBuilder } from "../../utils/regexBuilder.js";
import Categories from "../../models/Categories";
var ObjectId = mongoose.Types.ObjectId;

interface SearchFilter {
    _id?: string,
    storeCode?: mongoose.Types.ObjectId,
    nome?: RegExp
}
class CategoryController {

  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      let {id, storeCode, nome} = req.query;
      let cat = <SearchFilter>{};
      if (new Validators("id", id).validate().isValid) {
        cat._id = id as string;
      }
      if (new Validators("storeCode", storeCode).validate().isValid) {
        cat.storeCode = new ObjectId(storeCode as string);
      }
      if (new Validators("nome", nome).validate().isValid) {
        cat.nome = RegexBuilder.searchByName(nome as string);
      }
      req.result = Category.find(cat);
      next();
    } catch (e) {
      next(e);
    }
  }

//   static async add(req: Request, res: Response, next: NextFunction) {
//     try {
//       let category = new Category(req.body);
//       let lastCategory = await CategoryController.getLastCategory(category.storeCode);
//       if (lastCategory) {
//         category.ordenacao = lastCategory.ordenacao + 1;
//       } else {
//         category.ordenacao = 1;
//       }
//       await category.save();
//       return ApiResponse.success().send(res);
//     } catch (e) {
//       next(e);
//     }
//   }

  static async getLastCategory(storeCode: mongoose.Types.ObjectId) : Promise<mongoose.Document> {
    try {
      const categories = await Category.find({storeCode: storeCode});
      const data = categories.splice(-1)[0];
      return data;
    } catch (e) {
      return null;
    }
  }

//   static async updateName(req: Request, res: Response, next: NextFunction) {
//     try {
//       let {id, name} = req.body;
//       if (!Validators.checkField(id)) {
//         return ApiResponse.parameterNotFound("id").sendResponse(res);
//       }
//       if (!Validators.checkField(name)) {
//         return ApiResponse.parameterNotFound("name").sendResponse(res);
//       }
//       await Category.findByIdAndUpdate(id, {"nome": name})
//       return ApiResponse.success().send(res);
//     } catch (e) {
//       next(e);
//     }
//   }

//   static async changeOrder(req: Request, res: Response, next: NextFunction) {
//     try {
//       const from = req.body.from;
//       const to = req.body.to;
//       if (!Validators.checkField(from._id) && !Validators.checkField(from.ordenacao)) {
//         return ApiResponse.parameterNotFound('from').sendResponse(res);
//       }
//       if (!Validators.checkField(to._id) && !Validators.checkField(to.ordenacao)) {
//         return ApiResponse.parameterNotFound('to').sendResponse(res);
//       }
//       await Category.findByIdAndUpdate(from._id, {"ordenacao": to.ordenacao});
//       await Category.findByIdAndUpdate(to._id, {"ordenacao": from.ordenacao});
//       return ApiResponse.success().send(res);
//     } catch (e) {
//       next(e);
//     }
//   }

//   static async delete(req: Request, res: Response, next: NextFunction) {
//     try {
//       let id = req.body.id;
//       if (!Validators.checkField(id)) {
//         return ApiResponse.parameterNotFound('id').sendResponse(res);
//       }
//       if (await ProductController.productsHasCategory(id)) {
//         return ApiResponse.badRequest('Categoria não pode ser excluida se possuir produtos cadastrados').sendResponse(res);
//       }
//       await Category.findByIdAndDelete(id);
//       return ApiResponse.success().send(res);
//     } catch (e) {
//       next(e);
//     }
//   }
}

export default CategoryController;

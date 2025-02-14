import mongoose from "mongoose";
import { Validators } from "../../utils/validators";
import {Category} from "../../models/Categories";
import ApiResponse from "../../models/base/ApiResponse";
import ProductController from "./productController";
import { Request, Response, NextFunction } from "express";
import { RegexBuilder } from "../../utils/regexBuilder";
import InvalidParameter from "../../models/errors/InvalidParameters";
import NotFoundError from "../../models/errors/NotFound";
var ObjectId = mongoose.Types.ObjectId;

interface SearchFilter {
  _id?: string,
  storeCode?: mongoose.Types.ObjectId,
  nome?: RegExp
}
class CategoryController {

  static async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      let { id, storeCode, nome } = req.query;
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

  static async findOne(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id;
      const validation = new Validators("id", id, "string").validate();
      if (!validation.isValid) {
        throw new InvalidParameter(validation);
      }
      const category = await Category.findById(id);
      if (!category) {
        throw new NotFoundError();
      }
      return ApiResponse.success(category).send(res);
    } catch (e) {
      next(e);
    }
  }

  static async add(req: Request, res: Response, next: NextFunction) {
    try {
      let category = new Category(req.body);
      let lastCategory = await CategoryController.getLastCategory(category.storeCode);
      if (lastCategory) {
        const fetchDoc = new Category(lastCategory);
        category.ordenacao = fetchDoc.ordenacao + 1;
      } else {
        category.ordenacao = 1;
      }
      await category.save();
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }

  static async getLastCategory(storeCode: mongoose.Types.ObjectId): Promise<mongoose.Document> {
    try {
      const categories = await Category.find({ storeCode: storeCode });
      const data = categories.splice(-1)[0];
      return data;
    } catch (e) {
      return null;
    }
  }

  static async updateName(req: Request, res: Response, next: NextFunction) {
    try {
      let { id, name } = req.body;
      const idValidation = new Validators("id", id, "name").validate();
      const nameValidation = new Validators("name", name, "string").validate();
      if (!idValidation.isValid) {
        throw new InvalidParameter(idValidation);
      }
      if (!nameValidation.isValid) {
        throw new InvalidParameter(nameValidation);
      }
      await Category.findByIdAndUpdate(id, { "nome": name })
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }

  static async changeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const from = req.body.from;
      const to = req.body.to;
      const fromIdVal = new Validators("from._id", from._id, "string").validate();
      const fromOrder = new Validators("from.ordenacao", from.ordenacao, "number").validate();
      const toIdVal = new Validators("to._id", to._id, "string").validate();
      const toOrder = new Validators("to.ordenacao", to.ordenacao, "number").validate();
      if (!fromIdVal.isValid) {
        throw new InvalidParameter(fromIdVal);
      }
      if (!fromOrder.isValid) {
        throw new InvalidParameter(fromOrder);
      }
      if (!toIdVal.isValid) {
        throw new InvalidParameter(toIdVal);
      }
      if (!toOrder.isValid) {
        throw new InvalidParameter(toOrder);
      }
      await Category.findByIdAndUpdate(from._id, { "ordenacao": to.ordenacao });
      await Category.findByIdAndUpdate(to._id, { "ordenacao": from.ordenacao });
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      let id = req.body.id;
      const validation = new Validators("id", id, "string");
      if (!validation.validate().isValid) {
        throw new InvalidParameter(validation.validate());
      }
      if (await ProductController.productsHasCategory(id)) {
        return ApiResponse.badRequest('Categoria não pode ser excluida se possuir produtos cadastrados').send(res);
      }
      await Category.findByIdAndDelete(id);
      return ApiResponse.success().send(res);
    } catch (e) {
      next(e);
    }
  }
}

export default CategoryController;

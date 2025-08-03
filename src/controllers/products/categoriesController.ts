import mongoose from "mongoose";
import {categorySchemaValidation, ICategory} from "../../models/Categories";
import ApiResponse from "../../models/base/ApiResponse";
import { Request, Response, NextFunction } from "express";
import NotFoundError from "../../models/errors/NotFound";
import ICategoryRepository from "../../domain/interfaces/ICategoryRepository";
import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";
import BadRequestError from "../../models/errors/BadRequest";
import { autoInjectable, inject } from "tsyringe";

@autoInjectable()
class CategoryController {

  constructor(
    @inject("ICategoryRepository") private readonly repository : ICategoryRepository
  ) {}

  findAll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = z.object({
        storeCode: idValidation,
        id: idValidation.optional(),
        nome: z.string().min(1).optional()
      }).parse(req.query);

      req.result = this.repository.findAll(query.storeCode, query.id, query.nome);
      next();
    } catch (e) {
      next(e);
    }
  }

  findOne = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = idValidation.parse(req.params.id);
      
      const category = await this.repository.findOne(id);

      if (!category) {
        throw new NotFoundError();
      }
      return ApiResponse.success(category).send(res);
    } catch (e) {
      next(e);
    }
  }

  add = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = categorySchemaValidation
        .transform((value) => {
          return <ICategory>{
            nome: value.nome,
            storeCode: new mongoose.Types.ObjectId(value.storeCode),
            image: value.image,
          };
        })
        .parse(req.body);

      const newCategory = await this.repository.add(category);
      return ApiResponse.success(newCategory, 201).send(res);
    } catch (e) {
      next(e);
    }
  }

  update = async (req: Request, res: Response, next: NextFunction) => { 
    try {
      const id = idValidation.parse(req.params.id);
      const data = z.object({
        nome: z.string().min(1).optional(),
        image: z.string().base64().optional()
      })
      .transform((values) => {
        const body = <Partial<{
          nome: string,
          image: string
        }>>{};

        if (values.image) {
          body.image = values.image;
        }

        if (values.nome) {
          body.nome = values.nome;
        }

        return body;
      })
      .parse(req.body);

      if (!Object.values(data).length) {
        throw new BadRequestError("Nenhum dado de atualização foi informado.")
      }

      await this.repository.update(id, data);
      
      return ApiResponse.success().send(res);

    } catch (e) {
      next(e);
    }
  }

  updateOrdenation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      
      const storeCode = idValidation.parse(req.params.storeCode);

      const data = z.array(z.object({
        id: idValidation,
        ordenacao: z.number().min(1)
      })).parse(req.body);

      await this.repository.updateOrdenation(storeCode, data)

      return ApiResponse.success().send(res);

    } catch (e) {
      next(e);
    }
  }

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = idValidation.parse(req.params.id);

      const category = await this.repository.deleteOne(id);

      return ApiResponse.success(category, 200).send(res);
    } catch (e) {
      next(e);
    }
  }
}

export default CategoryController;

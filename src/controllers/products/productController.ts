import { Validators } from "../../utils/validators";
import { z } from "zod";
import ApiResponse from "../../models/base/ApiResponse";
import { booleanStringValidation, idValidation } from "../../utils/defaultValidations";
import NotFoundError from "../../models/errors/NotFound";

import { Request, Response, NextFunction } from "express";
import InvalidParameter from "../../models/errors/InvalidParameters";
import mongoose, { ObjectId } from "mongoose";
import { RegexBuilder } from "../../utils/regexBuilder";
import ProductHandler from "../../domain/handlers/products/productCreationHandler";
import { AddOnes } from "../../models/products/AddOnes";
import { Products } from "../../models/products/Products";
import { IProduct, IProductAddOne, PRODUCT_SCHEMA_VALIDATION, ProductFilters } from "../../domain/types/IProduct";
import { autoInjectable, inject } from "tsyringe";
import { IProductRepository } from "../../domain/interfaces/IProductRepository";

var ObjectId = mongoose.Types.ObjectId;

const handler = new ProductHandler();

@autoInjectable()
export default class ProductController {

    constructor(
        @inject('IProductRepository') private readonly productRepository: IProductRepository
    ) {}

    findAll = async (req: Request, _: Response, next: NextFunction) => {
        try {
            let prod = <ProductFilters>{};
            z.object({
                id: idValidation.optional(),
                produto: z.string().optional(),
                storeCode: idValidation.optional(),
                isActive: booleanStringValidation.optional(),
                categoryId: idValidation.optional(),
            }).transform((val) => {
                if (val.id) {
                    prod._id = new ObjectId(val.id);
                }
                if (val.produto) {
                    prod.produto = RegexBuilder.searchByName(val.produto);
                }
                if (val.categoryId) {
                    prod.category = new ObjectId(val.categoryId);
                }
                if (val.isActive) {
                    prod.isActive = val.isActive;
                }
                if (val.storeCode) {
                    prod.storeCode = new ObjectId(val.storeCode);
                }
            }).parse(req.query);

            if (req.headers.orderby) delete req.headers.orderby;
            if (req.headers.ordenation) delete req.headers.ordenation;

            req.result = this.productRepository.findAll(prod);

            next();
        } catch (e) {
            next(e);
        }
    }

    findOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const product = await this.productRepository.findOne(id);

            return ApiResponse.success(product).send(res);

        } catch (e) {
            next(e);
        }
    }

    addProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const data = PRODUCT_SCHEMA_VALIDATION.parse(req.body);
            
            
            const newProductAdd = await this.productRepository.add(data as IProduct);

            return ApiResponse.success(newProductAdd).send(res);
        } catch (e) {
            next(e);
        }
    };

    update = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const product = PRODUCT_SCHEMA_VALIDATION.parse(req.body);

            const newProduct = await this.productRepository.update(id, product as IProduct);

            return ApiResponse.success(newProduct).send(res);
        } catch (e) {
            next(e);
        }
    };

    deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            await this.productRepository.delete(id);

            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    };

    static async deleteImage(req: Request, res: Response, next: NextFunction) {
        try {
            let image = req.query.name;
            const imageValidation = new Validators("name", image, "string").validate();
            if (!imageValidation.isValid) {
                throw new InvalidParameter(imageValidation);
            } else {
                await Products.updateMany(
                    {
                        image: {
                            name: image,
                        },
                    },
                    { $unset: { image: "" } }
                );
                return ApiResponse.success().send(res);
            }
        } catch (e) {
            next(e);
        }
    }
}
import { Validators } from "../../utils/validators";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound";
import {Products} from "../../models/products/Products";
import { Request, Response, NextFunction } from "express";
import InvalidParameter from "../../models/errors/InvalidParameters";
import mongoose, { ObjectId } from "mongoose";
import { RegexBuilder } from "../../utils/regexBuilder";
var ObjectId = mongoose.Types.ObjectId;

interface ProductFilters {
    _id?: mongoose.Types.ObjectId,
    produto?: RegExp,
    storeCode?: mongoose.Types.ObjectId,
    isActive?: boolean,
    category?: mongoose.Types.ObjectId,
}
export default class ProductController {
    static async findAll(req: Request, _: Response, next: NextFunction) {
        try {
            let { id, produto, storeCode, isActive, categoryId } = req.query;
            let prod = <ProductFilters>{};
            const idValidation = new Validators("id", id).validate();
            const produtoValidation = new Validators("produto", produto).validate();
            const storeValidation = new Validators("storeCode", storeCode).validate();
            const isActiveValidation = new Validators("isActive", isActive).validate();
            const categoryIdValidation = new Validators("categoryId", categoryId).validate();

            if (idValidation.isValid) {
                prod._id = new ObjectId(id as string);
            }
            if (produtoValidation.isValid) {
                prod.produto = RegexBuilder.searchByName(produto as string);
            }
            if (categoryIdValidation.isValid) {
                prod.category = new ObjectId(categoryId as string);
            }
            if (isActiveValidation.isValid) {
                prod.isActive = (isActive as unknown) as boolean;
            }
            if (storeValidation.isValid) {
                prod.storeCode = new ObjectId(storeCode as string);
            }
            req.result = Products.find(prod).populate("category")
            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            let id = req.params.id;
            const product = await Products.findById(id);
            if (!product) {
                throw new NotFoundError("Produto não localizado");
            }
            return ApiResponse.success(product).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async addProduct(req: Request, res: Response, next: NextFunction) {
        try {
            let newProduct = new Products(req.body);
            const newProductAdd = await newProduct.save();
            return ApiResponse.success(newProductAdd).send(res);
        } catch (e) {
            next(e);
        }
    };

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            let id = req.body.id;
            let data = req.body.data;
            await Products.findByIdAndUpdate(id, { $set: data });
            ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    };

    static async deleteProduct(req: Request, res: Response, next: NextFunction) {
        try {
            let { id } = req.body;
            const idValidation = new Validators("id", id, "string").validate()
            if (!idValidation.isValid) {
                throw new InvalidParameter(idValidation);
            }
            await Products.findByIdAndDelete(id);
            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    };

    static async productsHasCategory(id: string): Promise<Boolean> {
        try {
            const data = await Products.find({ "category": id });
            if (data.length) {
                return true;
            }
            return false;
        } catch (e) {
            return false;
        }
    }

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
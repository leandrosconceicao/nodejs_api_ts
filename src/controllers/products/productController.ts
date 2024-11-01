import { Validators } from "../../utils/validators";
import { z } from "zod";
import ApiResponse from "../../models/base/ApiResponse";
import { booleanStringValidation, idValidation } from "../../utils/defaultValidations";
import NotFoundError from "../../models/errors/NotFound";
import { PRODUCT_SCHEMA_VALIDATION, Products } from "../../models/products/Products";
import { Request, Response, NextFunction } from "express";
import InvalidParameter from "../../models/errors/InvalidParameters";
import mongoose, { ObjectId } from "mongoose";
import { RegexBuilder } from "../../utils/regexBuilder";
import FirebaseStorage from "../../utils/firebase/storage";
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

            req.result = Products.find(prod).populate("category");

            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
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
            const data = PRODUCT_SCHEMA_VALIDATION.parse(req.body);
            const newProduct = new Products(data);
            const newProductAdd = await newProduct.save();
            return ApiResponse.success(newProductAdd).send(res);
        } catch (e) {
            next(e);
        }
    };

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const product = PRODUCT_SCHEMA_VALIDATION.parse(req.body);
            if (product.dataImage) {
                const link = await updateImage({
                    path: `assets/${product.storeCode}/${product.dataImage.path}`,
                    data: product.dataImage.data
                });
                if (link) {
                    product.image = link;
                }
            }
            const newProduct = await Products.findByIdAndUpdate(id, product, {
                new: true
            });
            return ApiResponse.success(newProduct).send(res);
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

async function updateImage(data: {
    path?: string;
    data?: string;
}): Promise<string | null> {
    try {
        const fireSrv = new FirebaseStorage();
        return fireSrv.uploadFile(data);
    } catch (e) {
        return null;
    }
}
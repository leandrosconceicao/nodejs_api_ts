import { Validators } from "../../utils/validators";
import { z } from "zod";
import ApiResponse from "../../models/base/ApiResponse";
import { booleanStringValidation, idValidation } from "../../utils/defaultValidations";
import NotFoundError from "../../models/errors/NotFound";
import { PRODUCT_SCHEMA_VALIDATION, Products, IProductAddOne, IProduct } from "../../models/products/Products";
import { Request, Response, NextFunction } from "express";
import InvalidParameter from "../../models/errors/InvalidParameters";
import mongoose, { ObjectId } from "mongoose";
import { RegexBuilder } from "../../utils/regexBuilder";
import FirebaseStorage from "../../utils/firebase/storage";
import ProductHandler from "../../domain/handlers/products/productCreationHandler";
import { AddOnes } from "../../models/products/AddOnes";

var ObjectId = mongoose.Types.ObjectId;

const handler = new ProductHandler();

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
            const product = await Products.findById<IProduct>(id)
                .populate("category");
            if (!product) {
                throw new NotFoundError("Produto não localizado");
            }
            if (product.addOnes) {
                for (let i = 0; i < product.addOnes.length; i++) {
                    let item = product.addOnes[i];
                    const addOne = await AddOnes.findById<IProductAddOne>(item._id)
                    if (addOne) {
                        item.name = addOne.name;
                        item.type = addOne.type;
                        item.maxQtdAllowed = addOne.maxQtdAllowed;
                        item.items = addOne.items;
                    }    
                }
            }
            return ApiResponse.success(product).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async addProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const data = PRODUCT_SCHEMA_VALIDATION.parse(req.body);
            
            handler.validateCategory(data.category)

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
            const id = idValidation.parse(req.params.id);

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
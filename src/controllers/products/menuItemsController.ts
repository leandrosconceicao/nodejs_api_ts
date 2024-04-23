import mongoose from "mongoose";
import {z} from "zod";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import MenuItems from "../../models/MenuItems";
import { Validators } from "../../utils/validators";
import InvalidParameter from "../../models/errors/InvalidParameters";
import categories from "../../models/Categories";

var ObjectId = mongoose.Types.ObjectId;

export default class MenuItemsController {
    static async get(req: Request, res: Response, next: NextFunction) {
        try {
            const query = z.object({
                storeCode: z.string().min(1).max(24)
            }).parse(req.query);
            const data = await MenuItems.aggregate([
                {
                    $match: {
                        storeCode: new ObjectId(query.storeCode)
                    }
                },
                {
                    $lookup: {
                        from: "products",
                        localField: "_id",
                        foreignField: "category",
                        as: "products",
                        pipeline: [{ $match: { 'isActive': true } }],
                    },
                },
                {
                    $project: {
                        _id: 0,
                        storeCode: 0,
                        // "products.preparacao": 0,
                        "products.categoria": 0,
                        "products.storeCode": 0,
                        // "products.status": 0,
                        "products.dataInsercao": 0,
                        "products.categoryId": 0,
                        "products.category": 0,
                        "products.createDate": 0,
                        "products.isActive": 0,
                    },
                },
                {
                    $sort: {
                        ordenacao: 1,
                    },
                },
            ]);
            data.forEach((category) => {
                category.products.forEach((products: any) => {
                    products.category = {
                        nome: category.nome,
                        storeCode: category.storeCode,
                        ordenacao: category.ordenacao,
                        createDate: category.createDate,
                        image: category.image,
                    }
                })
            })
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
}
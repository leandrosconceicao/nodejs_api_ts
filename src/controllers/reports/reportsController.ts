import mongoose from "mongoose";
import {Orders} from "../../models/Orders";
import { Products } from "../../models/products/Products.js";
import { isValidObjectId } from "mongoose";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery.js";
import { Validators } from "../../utils/validators";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound.js";
import InvalidParameter from "../../models/errors/InvalidParameters.js";
import TotalSales from "../../models/reports/Sales.js";
import categories from "../../models/Categories.js";

var ObjectId = mongoose.Types.ObjectId;

interface ReportQuery {
    storeCode: any,
    createDate: DateQuery,
    userCreate?: any,
    orderType?: string,
    products?: any,
    saller?: any,
    status: any,
    updated_at?: any,
}

export default class ReportsController {

    static async quantifySales(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeCode, from, to, saller, type, product } = req.query;
            const storeVal = new Validators("storeCode", storeCode).validate();
            const fromVal = new Validators("from", from).validate();
            const toVal = new Validators("to", to).validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            if (!fromVal.isValid) {
                throw new InvalidParameter(fromVal);
            }
            if (!toVal.isValid) {
                throw new InvalidParameter(toVal);
            }
            const query: ReportQuery = {
                storeCode: new ObjectId(storeCode as string),
                createDate: new PeriodQuery(from as string, to as string).build(),
                status: {
                    $ne: "cancelled"
                }
            };
            if (saller) {
                query.saller = saller;
            }
            if (type) {
                query.orderType = type as string;
            }
            if (product) {
                const isList = typeof product === "object";
                const prods = isList ? (product as Array<any>) : [product];
                query.products = {
                    $elemMatch: {
                        productId: {
                            $in: prods.map((e) => new ObjectId(e as any))
                        }
                    }
                }
            }
            const consult = await querySales(query);
            if (!consult) {
                throw new NotFoundError("Busca não localizou dados");
            }
            return ApiResponse.success({
                totalValue: consult.reduce((a, b) => a + b.total, 0),
                orders: consult
            }).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async quantifySalesByProduct(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeCode, from, to, saller, type, product, category } = req.query;
            const storeVal = new Validators("storeCode", storeCode).validate();
            const fromVal = new Validators("from", from).validate();
            const toVal = new Validators("to", to).validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            if (!fromVal.isValid) {
                throw new InvalidParameter(fromVal);
            }
            if (!toVal.isValid) {
                throw new InvalidParameter(toVal);
            }
            const query: ReportQuery = {
                storeCode: new ObjectId(storeCode as string),
                createDate: new PeriodQuery(from as string, to as string).build(),
                status: {
                    $ne: "cancelled"
                }
            };
            let products;
            if (saller) {
                query.saller = saller;
            }
            if (type) {
                query.orderType = type as string;
            }
            const prods = await getProducts(storeCode as string, category as any, product as any);
            const prodList = prods.map((e) => e._id);
            query.products = {
                $elemMatch: {
                    productId: {
                        $in: prodList
                    }
                }
            }
            products = prodList.map((e) => e.toString());
            const orders2 = await querySales(query);
            const data = prepareData(orders2, products);
            const total = getTotal(data);
            return ApiResponse.success({
                total: total
            }).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async averagePreparationTime(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeCode, from, to } = req.query;
            const storeVal = new Validators("storeCode", storeCode).validate();
            const fromVal = new Validators("from", from).validate();
            const toVal = new Validators("to", to).validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            if (!fromVal.isValid) {
                throw new InvalidParameter(fromVal);
            }
            if (!toVal.isValid) {
                throw new InvalidParameter(toVal);
            }
            const query: ReportQuery = {
                storeCode: new ObjectId(storeCode as string),
                createDate: new PeriodQuery(from as string, to as string).build(),
                status: "finished",
                updated_at: {$ne: null}
            };
            const consult = await Orders.find(query, {
                _id: 0,
                dateDiff: {
                    $dateDiff: {
                    startDate: "$createDate",
                    endDate: "$updated_at",
                    "unit": "minute"
                    }
                }
            }).lean();
            const avgTime = consult.reduce((a, b) => {
                return a + b.dateDiff;
            }, 0) / consult.length;
            return ApiResponse.success({avgTime: parseFloat(avgTime.toFixed(2))}).send(res);
        } catch (e) {
            next(e);
        }
    }
}

async function querySales(query: ReportQuery) {
    return TotalSales.aggregate([
        {
            $match: query
        },
        {
            $project: {
                total: {
                    $sum: {
                        $map: {
                            input: {
                                $range: [
                                    0,
                                    {
                                        $size: "$products",
                                    },
                                ],
                            },
                            as: "ix",
                            in: {
                                $let: {
                                    in: {
                                        $multiply: ["$$pre", "$$cal"],
                                    },
                                    vars: {
                                        pre: {
                                            $arrayElemAt: ["$products.quantity", "$$ix"],
                                        },
                                        cal: {
                                            $arrayElemAt: ["$products.unitPrice", "$$ix"],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                createDate: 1,
                // storeCode: 1,
                pedidosId: 1,
                orderType: 1,
                products: 1,
            },
        }
    ]);
}

async function getProducts(storeCode: string, categoryId?: string | Array<string>, productId?: string | Array<string>) {
    if (categoryId) {
        let query;
        const isList = typeof categoryId === "object";
        if (isList) {
            query = {
                isActive: true,
                category: {
                    $in: categoryId.map((e) => new ObjectId(e))
                }
            }
        } else {
            query = {
                category: new ObjectId(categoryId),
                isActive: true
            }
        }
        return Products.find(query, {_id: 1}).lean();
    }
    return Products.find({storeCode: new ObjectId(storeCode), _id: productId}, {_id: 1}).lean();
}

function prepareData(orders: Array<any>, products: Array<any>) {
    let data = <any>[];
    orders.forEach((order) => {
        const or: {
            order?: any,
            products?: any
        } = {};
        or.order = order._id;
        const filtred = order.products.filter((prod: any) => products.includes(prod.productId.toString()));
        or.products = filtred;
        data.push(or)
    });
    return data;
}

function getTotal(data: Array<any>): number {
    return data.reduce(
      (total, value) =>
        total +
        value.products.reduce((tot: any, vl: any) => tot + vl.quantity * vl.unitPrice, 0),
      0
    );
  }
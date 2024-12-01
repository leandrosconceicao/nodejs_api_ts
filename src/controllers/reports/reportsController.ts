import mongoose from "mongoose";
import {z} from "zod";
import {OrderType} from "../../models/Orders";
import { Products } from "../../models/products/Products";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery";
import { Validators } from "../../utils/validators";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound";
import InvalidParameter from "../../models/errors/InvalidParameters";
import TotalSales from "../../models/reports/Sales";
import { idValidation } from "../../utils/defaultValidations";
import ReportHandler from "../../domain/handlers/reports/reportsHandler";

var ObjectId = mongoose.Types.ObjectId;

interface ReportQuery {
    storeCode: mongoose.Types.ObjectId,
    createdAt: DateQuery,
    createdBy?: mongoose.Types.ObjectId,
    orderType?: string,
    products?: any,
    status: any,
    updated_at?: any,
}

export default class ReportsController {

    static async establishmentAnaltic(req: Request, res: Response, next: NextFunction) {
        try {
            const storeCode = idValidation.parse(req.params.id);
            const query = z.object({
                from: z.string().datetime({offset: true}),
                to: z.string().datetime({offset: true})
            })
            .transform((val) => {
                return new PeriodQuery(val.from, val.to).build();
            })
            .parse(req.query);

            const report = await new ReportHandler().getAnalyticData(storeCode, query)
            ApiResponse.success(report[0]).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async getPaymentsByCashregister(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const data = await new ReportHandler().getCashRegister(new ObjectId(id));
            ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async getPayments(req: Request, res: Response, next: NextFunction) {
        try {
            const query = z.object({
                storeCode: idValidation,
                from: z.string().datetime({offset: true}),
                to: z.string().datetime({offset: true})
            }).parse(req.query)
            
            const data = await new ReportHandler().getPaymentsByMethods(query)
            
            ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async quantifySales(req: Request, res: Response, next: NextFunction) {
        try {
            const query: Partial<ReportQuery> = {
                status: {
                    $ne: "cancelled"
                }
            }
            z.object({
                storeCode: idValidation,
                from: z.string().datetime({offset: true}),
                to: z.string().datetime({offset: true}),
                type: z.nativeEnum(OrderType).optional(),
                saller: idValidation.optional(),
                product: idValidation.or(z.array(idValidation)).optional()
            })
            .transform((value) => {
                
                query.storeCode = new ObjectId(value.storeCode);

                query.createdAt = new PeriodQuery(value.from, value.to).build();

                if (value.type) {
                    query.orderType = value.type;
                }

                if (value.saller) {
                    query.createdBy = new ObjectId(value.saller)
                }

                if (value.product) {
                    const isList = typeof value.product === "object";
                    const prods = isList ? (value.product as Array<any>) : [value.product];
                    query.products = {
                        $elemMatch: {
                            productId: {
                                $in: prods.map((e) => new ObjectId(e as any))
                            }
                        }
                    }                    
                }
            })
            .parse(req.query);
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
                createdAt: new PeriodQuery(from as string, to as string).build(),
                status: {
                    $ne: "cancelled"
                }
            };
            let products;
            if (saller) {
                query.createdBy = new ObjectId(saller as string);
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
}

async function querySales(query: Partial<ReportQuery>) {
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
                createdAt: 1,
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
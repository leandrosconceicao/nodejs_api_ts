import mongoose from "mongoose";
import {z} from "zod";
import {IOrder, IOrderProduct, OrderType} from "../../models/Orders";
import { IProduct, Products } from "../../models/products/Products";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound";
import {TotalSales, ITotalSales} from "../../models/reports/Sales";
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

interface IPreparation {
    order?: string,
    products?: IProduct[]
};

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
            const search: Partial<ReportQuery> = {};

            const query = z.object({
                storeCode: idValidation,
                from: z.string().datetime({offset: true}),
                to: z.string().datetime({offset: true}),
                saller: idValidation.optional(),
                type: z.nativeEnum(OrderType).optional(),
                product: idValidation.or(z.array(idValidation)).optional(),
                category: idValidation.optional(),
            })
            .transform((values) => {
                search.storeCode = new ObjectId(values.storeCode),

                search.createdAt = new PeriodQuery(values.from, values.to).build(),

                search.status = {
                    $ne: "cancelled"
                }

                if (values.saller) {
                    search.createdBy = new ObjectId(values.saller);
                }

                if (values.type) {
                    search.orderType = values.type;
                }

                return values;
            })
            .parse(req.query);

            const prods = await getProducts(query.category, query.product);

            const detailProducts : Array<Partial<{
                product: string,
                total: number,
                quantity: number
            }>> = [];

            for (let i = 0; i < prods.length; i++) {
                const prod = prods[i];
                const value: Partial<{
                    product: string,
                    total: number,
                    quantity: number
                }> = {}

                value.product = prod.produto;

                search.products = {
                    $elemMatch: {
                        productId: new ObjectId(prod._id)
                    }
                }

                const orders2 = await querySales(search);

                const data = prepareData(orders2, [prod._id.toString()]);

                value.total = getTotal(data);

                value.quantity = getQuantity(data);

                detailProducts.push(value);
            }
            ApiResponse.success({
                totalSale: detailProducts.reduce((a, b) => a + (b.total ?? 0.0), 0.0),
                details: detailProducts
            }).send(res);

        } catch (e) {
            next(e);
        }
    }
}

async function querySales(query: Partial<ReportQuery>) {
    return TotalSales.aggregate<ITotalSales>([
        {
            $match: query
        },
        {
            $project: {
                quantity: {
                    $sum: {
                        $map: {
                        input: {
                            $range: [
                            0,
                            {
                                $size: "$products"
                            }
                            ]
                        },
                        as: "ix",
                        in: {
                            $let: {
                            in: {
                                $multiply: ["$$pre"]
                            },
                            vars: {
                                pre: {
                                $arrayElemAt: [
                                    "$products.quantity",
                                    "$$ix"
                                ]
                                }
                            }
                            }
                        }
                        }
                    }
                    },
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
                discount: 1
            },
        }
    ]);
}

async function getProducts(categoryId?: string | Array<string>, productId?: string | Array<string>) : Promise<Array<IProduct>> {
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
        return Products.find(query, {_id: 1, produto: 1});
    }
    return Products.find({_id: productId}, {_id: 1, produto: 1});
}

function prepareData(orders: Array<ITotalSales>, products: Array<string>) : Array<IPreparation> {
    
    const data : IPreparation[] = [];

    orders.forEach((order) => {
        const or: IPreparation = {};
        or.order = order._id;
        const filtred = order.products.filter((prod: any) => products.includes(prod.productId.toString()));
        or.products = filtred;
        data.push(or)
    });
    return data;
}

function getTotal(data: Array<IPreparation>): number {
    return data.reduce(
      (total, value) =>
        total +
        value.products.reduce((tot: any, vl: any) => tot + vl.quantity * vl.unitPrice, 0),
      0
    );
  }

function getQuantity(data: IPreparation[]) : number {
    return data.reduce(
        (total, value) =>
          total +
          value.products.reduce((tot: any, vl: any) => tot + vl.quantity, 0),
        0
      );
}
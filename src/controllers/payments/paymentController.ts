import mongoose from "mongoose";
import { Validators } from "../../utils/validators";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import { PAYMENT_SEARCH_VALIDATION, Payments, paymentValidation } from "../../models/Payments";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery";
import NotFoundError from "../../models/errors/NotFound";
import InvalidParameter from "../../models/errors/InvalidParameters";
import PixChargesController from "./pixChargesController";
import { getOpenCashRegister } from "./cashRegisterController";
import { idValidation } from "../../utils/defaultValidations";
import z from "zod";
var ObjectId = mongoose.Types.ObjectId;

const populateUser = "userCreate";
const populateEstablish = ["-establishments", "-pass"]

interface QuerySearch {
    storeCode?: string
    createDate?: DateQuery,
    userCreate?: string | number | mongoose.mongo.BSON.ObjectId | mongoose.mongo.BSON.ObjectIdLike | Uint8Array,
    form?: string,
}

export default class PaymentController {
    
    static async findAllByAccount(req: Request, res: Response, next: NextFunction) {
        try {
            const storeCode = idValidation.parse(req.params.storeCode);
            const accountId = idValidation.parse(req.params.accountId);
            const payments = await Payments.find({
                storeCode: storeCode,
                accountId: accountId
            })
            // .populate("userCreateDetail", populateEstablish)
            // .populate("userUpdatedDetail", populateEstablish)
            .populate("value.methodData");
            return ApiResponse.success(payments).send(res);
        } catch (e) {
            next(e);
        }
    }
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const {storeCode, userCreate, to, from, type} = req.query;
            const query: QuerySearch = {};
            const storeVal = new Validators("storeCode", storeCode, "string").validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            const fromVal = new Validators("from", from, "string").validate();
            const toVal = new Validators("to", to, "string").validate();
            query.storeCode = storeCode as string;
            if (!fromVal.isValid) {
                throw new InvalidParameter(fromVal);
            }
            if (!toVal.isValid) {
                throw new InvalidParameter(toVal);
            }
            const period = new PeriodQuery(from as string, to as string);
            query.createDate = period.build();
            const usrVal = new Validators("userCreate", userCreate, "string").validate();
            const typeVal = new Validators("type", type, "string").validate();
            if (usrVal.isValid) {
                query.userCreate = new ObjectId(userCreate as string);
            }
            if (typeVal.isValid) {
                query.form = type as string
            }
            req.result = Payments.find(query).populate(populateUser, populateEstablish);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const payment = await Payments.findById(id).populate(populateUser, populateEstablish);
            if (!payment) {
                throw new NotFoundError("Pagamento não localizado");
            }
            return ApiResponse.success(payment).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async add(req: Request, res: Response, next: NextFunction) {
        try {
            const cashOpened = await getOpenCashRegister(req.body.userCreate);
            if (!cashOpened) {
                throw ApiResponse.badRequest("Usuário não possui caixa aberto para realizar lançamentos")
            }
            req.body.cashRegisterId = cashOpened._id.toString();
            const newPayment = await PaymentController.savePayment(req.body);
            const parsePayment = await newPayment.populate(populateUser, populateEstablish);
            return ApiResponse.success(parsePayment).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async rollBackPayments(req: Request, res: Response, next: NextFunction) {
        try {
            const {payments, userId} : {payments?: Array<string>, userId: string} = req.body;
            const paymentVal = new Validators("payments", payments, "array").validate();
            if (!paymentVal.isValid) {
                throw new InvalidParameter(paymentVal);
            }
            if (!payments.length) {
                throw ApiResponse.badRequest("Nenhum ID de pagamento foi informado");
            }
            const userIdVal = new Validators("userId", userId, "string").validate();
            if (!userIdVal.isValid) {
                throw new InvalidParameter(userIdVal);
            }
            const fetchedPays = await Payments.find({
                _id: {$in: payments}
            }).lean();
            const filtred = fetchedPays.filter((e) => !e.refunded);
            if (!filtred.length) {
                return ApiResponse.badRequest("Pagamentos já foram estornados").send(res);
            }
            await Payments.updateMany({
                refunded: false,
                _id: {$in: filtred.map((e) => e._id)}
            }, {
                $set: {
                    refunded: true,
                    userUpdated: new ObjectId(userId),
                    updateDate: new Date()
                }
            });
            cancelCharge(filtred)
            filtred.forEach((e) => {
                delete e._id;
                e.value.value = e.value.value * (-1);
                e.refunded = true;
            });
            await Payments.insertMany(filtred.map((e) => new Payments(e)));
            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    // static async delete(req: Request, res: Response, next: NextFunction) {
    //     try {
    //         const {id} = req.body;
    //         const idVal = new Validators("id", id, "string").validate();
    //         if (!idVal.isValid) {
    //             throw new InvalidParameter(idVal);
    //         }
    //         const process = await Payments.findByIdAndDelete(id);
    //         if (!process.ok) {
    //             throw new NotFoundError("Pagamento não localizado");
    //         }
    //         return ApiResponse.success(process).send(res);
    //     } catch (e) {   
    //         next(e);
    //     }
    // }

    static async savePayment(data: any) {
        if (!data.value) {
            throw ApiResponse.invalidParameter("value");
        }
        if (data.value.txId) {
            const payment = await Payments.findOne({
                "value.txId": data.value.txId
            });
            return payment;
        }
        const newPayment = new Payments(paymentValidation.parse(data));
        const process = await newPayment.save();
        return process;
    }

    static async getAccountPayments(accountId: string) {
        const data = await Payments.find({
            accountId: new ObjectId(accountId)
        })
        .populate(populateUser, populateEstablish)
        .populate("value.methodData");
        return data;
    }

    static async getPayments(query: mongoose.FilterQuery<typeof Payments>) {
        return await Payments.aggregate([
            {
                '$match': query
            }, {
                '$group': {
                '_id': '$value.method', 
                'total': {
                    '$sum': '$value.value'
                }
                }
            }, {
                '$lookup': {
                'from': 'paymentmethods', 
                'localField': '_id', 
                'foreignField': '_id', 
                'as': 'result'
                }
            }, {
                '$replaceRoot': {
                'newRoot': {
                    '$mergeObjects': [
                    {
                        '$arrayElemAt': [
                        '$result', 0
                        ]
                    }, '$$ROOT'
                    ]
                }
                }
            }, {
                '$project': {
                'total': 1, 
                'description': 1
                }
            }
            ]);
    }
}

async function cancelCharge(payments: Array<any>) {
    const data = payments.filter((e) => e.value.txId !== undefined);
    if (!data.length) {
        return;
    }
    await PixChargesController.onCancelPix(data);
}
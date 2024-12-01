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

const populateUser = "userCreateDetail";
const populateEstablish = ["-establishments", "-pass"]

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
            const query = PAYMENT_SEARCH_VALIDATION.parse(req.query);
            req.result = Payments.find(query)
                // .populate(populateUser, populateEstablish);
            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const payment = await Payments.findById(id)
                .populate(populateUser, populateEstablish)
                .populate("methodData");
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
                e.total = e.total * (-1);
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

    static async savePayment(value: any) {
        const data = paymentValidation.parse(value)
        // if (!data.value) {
        //     throw ApiResponse.invalidParameter("value");
        // }
        // if (data.value.txId) {
        //     const payment = await Payments.findOne({
        //         "value.txId": data.value.txId
        //     });
        //     return payment;
        // }
        const newPayment = new Payments(data);
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
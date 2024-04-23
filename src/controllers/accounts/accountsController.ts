import { Validators } from "../../utils/validators";
import {z} from "zod";
import { idValidation } from "../../utils/defaultValidations";
import ApiResponse from "../../models/base/ApiResponse";
import {Accounts, accountStatus} from "../../models/Accounts";
import NotFoundError from "../../models/errors/NotFound";
import InvalidParameter from "../../models/errors/InvalidParameters";
import mongoose from "mongoose";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery";
import { Request, Response, NextFunction } from "express";
import ApiFilters from "../../models/base/ApiFilters";
import OrdersController from "../orders/ordersController";
import PaymentController from "../payments/paymentController";
var ObjectId = mongoose.Types.ObjectId;

const populateClient = "client";
const populateCreated = "created_by";
const populateEstablish = ["-establishments", "-pass"];

export default class AccountsController extends ApiFilters {

    constructor() {
        super()
    }

    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const searchQuery = z.object({
                storeCode: idValidation,
                userCreate: idValidation.optional(),
                from: z.string().optional(),
                to: z.string().optional(),
                createDate: z.any().optional(),
                status: z.enum(['open', 'closed', 'checkSolicitation']).optional(),
                deleted_id: z.null().optional(),
            }).parse(req.query);
            searchQuery.deleted_id = null;
            if (searchQuery.from && searchQuery.to) {
                searchQuery.createDate = new PeriodQuery(
                    searchQuery.from,
                    searchQuery.to
                ).build();
                delete searchQuery.from;
                delete searchQuery.to;
            }
            req.result = Accounts.find(searchQuery)
                .populate(populateClient)
                .populate(populateCreated, populateEstablish);
            next();
        } catch (e) {
            next(e);
        }

    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const account = await getAccountData(id);
            return ApiResponse.success(account).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async addNew(req: Request, res: Response, next: NextFunction) {
        try {
            const newAccount = new Accounts(req.body);
            const process = await newAccount.save();
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async edit(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id;
            const {description} : {description: string} = req.body;
            const idVal = new Validators("id", id, "string").validate();
            const descVal = new Validators("description", description, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            if (!descVal.isValid) {
                throw new InvalidParameter(descVal);
            }
            const process = await Accounts.findByIdAndUpdate(id, {
                description: description,
            }, {new: true})
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async del(req: Request, res: Response, next: NextFunction) {
        try {
            const body = z.object({
                id: z.string().min(1).max(24)
            }).parse(req.body);
            const checkData = await getAccountData(body.id);
            if (checkData.payments.length) {
                throw ApiResponse.badRequest("Conta não pode ser excluida, conta possui recebimentos");
            }
            if (checkData.orders.length) {
                throw ApiResponse.badRequest("Conta não pode ser excluida, conta possui pedidos realizados");
            }
            await Accounts.findByIdAndUpdate(body.id, {
                deleted_id: body.id
            })
            return ApiResponse.success().send(res);
        } catch (e) {
            next(e);
        }
    }

    static async manageStatus(req: Request, res: Response, next: NextFunction) {
        try {
            const {status} : {status: string} = req.body;
            const id = req.params.id;
            const idVal = new Validators("id", id, "string").validate();
            const statusVal = new Validators("status", status, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            if (!statusVal.isValid) {
                throw new InvalidParameter(statusVal);
            }
            if (!accountStatus.includes(status)) {
                throw ApiResponse.badRequest(`Status inválido, valores permitidos: [${accountStatus}]`);
            }
            if (status === "closed") {
                let condition = await accountCanBeClosed(id);
                if (!condition) {
                    return ApiResponse.badRequest("Conta não pode ser fechada, há pedidos pendentes de pagamento").send(res);
                }
                OrdersController.finishOrdersOnCloseAccount(id);
            }
            const process = await Accounts.findByIdAndUpdate(new ObjectId(id), {status: status}, {
                returnDocument: "after"
            });
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }
    
    static async canReceiveNewOrder(accountId: string) {
        const account = await Accounts.findById(accountId, {status: -1});
        return account.status === "open";
    }
}

async function accountCanBeClosed(accountId: string) {
    const ACCOUNT = await getAccountData(accountId);
    if (!ACCOUNT) {
        return false;
    }
    const payments = ACCOUNT.payments as Array<any>;
    const orders = ACCOUNT.orders as Array<any>;
    let totalPayed = payments.reduce((a, b) => b.value.value + a, 0);
    let products = orders.map((e) => e.products);
    let totalOrdered = products.flat().reduce((a, b) => (b.quantity * b.unitPrice) + a, 0);
    return totalPayed === totalOrdered;
}

async function getAccountData(accountId: string) {
    let account = await Accounts.findById(accountId)
        .populate(populateClient)
        .populate(populateCreated, populateEstablish)
        .lean();
    if (!account) {
        throw new NotFoundError("Conta não localizada");
    }
    const orders = await OrdersController.getOrdersFromAccount(accountId);
    const payments = await PaymentController.getAccountPayments(accountId);
    account.orders = orders;
    account.payments = payments;
    return account;
}
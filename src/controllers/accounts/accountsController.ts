import { Validators } from "../../utils/validators";
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
            const { storeCode, status, from, to, created_by } = req.query;
            const storeVal = new Validators("storeCode", storeCode, "string").validate();
            const fromVal = new Validators("from", from, "string").validate();
            const toVal = new Validators("to", to, "string").validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            if (!fromVal.isValid) {
                throw new InvalidParameter(fromVal);
            }
            if (!toVal.isValid) {
                throw new InvalidParameter(toVal);
            }
            const searchQuery = AccountsController.filters();
            searchQuery.storeCode = storeCode as string;
            searchQuery.createDate = new PeriodQuery(from as string, to as string).build();
            if (created_by) {
                searchQuery.userCreate = new ObjectId(created_by as string);
            }
            if (status) {
                searchQuery.status = status as string;
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
            const id = req.params.id;
            const idVal = new Validators("id", id, "string").validate();
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
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
            }, {returnDocument: "after"})
            return ApiResponse.success(process).send(res);
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
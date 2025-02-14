import { Validators } from "../../utils/validators";
import {z} from "zod";
import { idValidation } from "../../utils/defaultValidations";
import ApiResponse from "../../models/base/ApiResponse";
import {Accounts, accountStatus, accountValidation, IReceiptOrders, IReceiptPayments, Receipt} from "../../models/Accounts";
import NotFoundError from "../../models/errors/NotFound";
import InvalidParameter from "../../models/errors/InvalidParameters";
import mongoose, { ObjectId } from "mongoose";
import { PeriodQuery } from "../../utils/PeriodQuery";
import { Request, Response, NextFunction } from "express";
import ApiFilters from "../../models/base/ApiFilters";
import OrdersController from "../orders/ordersController";
import PaymentController from "../payments/paymentController";
import { clientsSchemaValidation } from "../../models/Clients";
import { Establishments } from "../../models/Establishments";
import {Orders} from "../../models/Orders";
import { Payments } from "../../models/Payments";
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
                from: z.string().datetime({offset: true}),
                created_by: idValidation.optional(),
                to: z.string().datetime({offset: true}),
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
                .populate(populateCreated, populateEstablish)
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

    static async findOneV2(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const account = await AccountsController.getReceipt(id);
            return ApiResponse.success(account).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async addNew(req: Request, res: Response, next: NextFunction) {
        try {
            const newAccount = new Accounts(z.object({
                description: z.string().min(1),
                storeCode: idValidation,
                created_by: idValidation,
                status: z.enum(['open', 'closed', 'checkSolicitation']).default('open'),
                client: clientsSchemaValidation.optional(),
            }).parse(req.body));
            const process = await newAccount.save();
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async edit(req: Request, res: Response, next: NextFunction) {
        try {
            const id = idValidation.parse(req.params.id);
            const body = accountValidation.parse(req.body);
            const process = await Accounts.findByIdAndUpdate(id, {
                ...body,
                updatedAt: new Date()
            }, {new: true})
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async del(req: Request, res: Response, next: NextFunction) {
        try {
            const body = z.object({
                id: idValidation
            }).parse(req.body);
            const checkData = await AccountsController.getReceipt(body.id);
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

    static async manageAccountTip(req: Request, res: Response, next: NextFunction) {
        try {
            const storeCode = idValidation.parse(req.params.storeCode);
            const accountId = idValidation.parse(req.params.accountId);
            const data = z.object({
                enabledTip: z.boolean()
            }).parse(req.body);
            const store = await Establishments.findById(storeCode);
            if (!store) {
                return;
            }
            const process = await Orders.updateMany({
                accountId: accountId,
                storeCode: storeCode
            }, {
                $set: {
                    "products.$[].tipValue": data.enabledTip ? store.tipValue : 0
                }
            });
            if (!process.modifiedCount) {
                throw ApiResponse.badRequest("Nenhum dado atualizado, verifique os filtros informados");
            }
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

    static async getReceipt(accountId: string) {

        const data = await Promise.all([
            Orders.find({
                accountId: new ObjectId(accountId),
                status: {
                    $ne: "cancelled"
                }
            }),
            Payments.find({
                accountId: new ObjectId(accountId)
            }).populate("methodData")
        ])

        const ords = data[0] ?? [];
        const pays = data[1] ?? [];

        const rec = <Receipt>{
            _id: accountId,
            orders: ords.map((e) => <IReceiptOrders>{
                _id: e.id,
                discount: e.discount,
                totalProduct: e.totalProduct,
                subTotal: e.subTotal,
                totalTip: e.products.reduce((a, b) => a + (b.tipValue * b.totalProduct), 0.0),
                products: e.products,
            }),
            payments: pays.map((el) => <IReceiptPayments> {
                total: el.total,
                description: el.methodData?.description,
                method: el._id
            }),
            allProductsHasTipValue: ords.every((order) => order.products.every((product) => product.tipValue > 0))
        };
        rec.totalTip = rec.orders.reduce((prev, next) => prev + next.totalTip, 0.0);
        rec.totalOrder = rec.orders.reduce((a, b) => a + b.subTotal, 0.0);
        rec.totalProducts = rec.orders.reduce((a, b) => a + b.totalProduct, 0.0);
        rec.totalPayment = rec.payments.reduce((a, b) => a + b.total, 0.0);
        rec.subTotal = rec.totalOrder - rec.totalPayment;
        return rec;
    }
}

async function accountCanBeClosed(accountId: string) {
    const ACCOUNT = await AccountsController.getReceipt(accountId);
    if (!ACCOUNT) {
        return false;
    }
    let totalPayed = ACCOUNT.totalPayment.toFixed(2);
    let totalOrdered = ACCOUNT.totalOrder.toFixed(2);
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
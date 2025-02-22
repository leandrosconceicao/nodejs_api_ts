import {z} from "zod";
import { idValidation } from "../../utils/defaultValidations";
import ApiResponse from "../../models/base/ApiResponse";
import {Accounts, AccountStatus, accountValidation, IAccount, IReceiptOrders, IReceiptPayments, Receipt} from "../../models/Accounts";
import mongoose, { ObjectId } from "mongoose";
import { PeriodQuery } from "../../utils/PeriodQuery";
import { Request, Response, NextFunction } from "express";
import { clientsSchemaValidation } from "../../models/Clients";
import {Orders} from "../../models/Orders";
import { Payments } from "../../models/Payments";
import { autoInjectable, inject } from "tsyringe";
import IAccountRepository from "../../domain/interfaces/IAccountRepository";
import IOrderRepository from "../../domain/interfaces/IOrderRepository";
var ObjectId = mongoose.Types.ObjectId;


@autoInjectable()
export default class AccountsController {

    constructor(
        @inject('IAccountRepository') private readonly accountRepository : IAccountRepository,
        @inject('IOrderRepository') private readonly orderRepository : IOrderRepository,
    ) {}

    findAll = async (req: Request, _: Response, next: NextFunction) => {
        try {
            const searchQuery = z.object({
                storeCode: idValidation,
                from: z.string().datetime({offset: true}),
                created_by: idValidation.optional(),
                to: z.string().datetime({offset: true}),
                createdAt: z.any().optional(),
                status: z.enum(['open', 'closed', 'checkSolicitation']).optional(),
                deleted_id: z.null().optional(),
            }).parse(req.query);
            searchQuery.deleted_id = null;
            if (searchQuery.from && searchQuery.to) {
                searchQuery.createdAt = new PeriodQuery(
                    searchQuery.from,
                    searchQuery.to
                ).build();
                delete searchQuery.from;
                delete searchQuery.to;
            }
            req.result = this.accountRepository.findAll(searchQuery);
            next();
        } catch (e) {
            next(e);
        }

    }

    findOne = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);
            
            const account = await this.accountRepository.findOne(id);

            return ApiResponse.success(account).send(res);
        } catch (e) {
            next(e);
        }
    }

    addNew = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const newAccount = z.object({
                description: z.string().min(1),
                storeCode: idValidation,
                status: z.nativeEnum(AccountStatus).default(AccountStatus.open),
                created_by: idValidation.default(req.autenticatedUser.id),
                client: clientsSchemaValidation.optional(),
            })
            .parse(req.body)

            const process = await this.accountRepository.addNew(newAccount as IAccount);

            return ApiResponse.success(process).send(res);

        } catch (e) {
            next(e);
        }
    }

    edit = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);
            const body = accountValidation.parse(req.body);
            const process = await this.accountRepository.update(id, body);
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    del = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const deleted = await this.accountRepository.delete(id);
            
            return ApiResponse.success(deleted).send(res);
        } catch (e) {
            next(e);
        }
    }

    manageAccountTip = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const storeCode = idValidation.parse(req.params.storeCode);
            
            const accountId = idValidation.parse(req.params.accountId);

            const data = z.object({
                enabledTip: z.boolean()
            }).parse(req.body);

            await this.orderRepository.manageTipValue(storeCode, accountId, data.enabledTip)

            return ApiResponse.success(null, 204).send(res);
        } catch (e) {
            next(e);
        }
    }

    manageStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.id);

            const data = z.object({
                status: z.enum(['open', 'closed', 'checkSolicitation'])
            }).parse(req.body);

            if (data.status === 'closed') {
                const accountCanBeClosed = await this.accountCanBeClosed(id);
                if (accountCanBeClosed) {

                }
            }

            const updateProcess = await this.accountRepository.update(id, {
                status: data.status
            })

            return ApiResponse.success(updateProcess).send(res);
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

    accountCanBeClosed = async (accountId: string) => {

        const ACCOUNT = await this.accountRepository.findOne(accountId);
        
        let totalPayed = ACCOUNT.totalPayment.toFixed(2);
        let totalOrdered = ACCOUNT.totalOrder.toFixed(2);
        return totalPayed === totalOrdered;
    }
}
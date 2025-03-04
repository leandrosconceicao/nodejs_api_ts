import { injectable, registry, delay, inject } from "tsyringe";
import IAccountRepository from "../domain/interfaces/IAccountRepository";
import { Accounts, IAccount, IAccountSearch, IReceiptOrders, IReceiptPayments, Receipt } from "../models/Accounts";
import IOrderRepository from "../domain/interfaces/IOrderRepository";
import { ObjectId } from "../controllers/orders/ordersController";
import { Orders } from "../models/Orders";
import { Payments } from "../models/Payments";
import NotFoundError from "../models/errors/NotFound";
import BadRequestError from "../models/errors/BadRequest";


const populateClient = "client";
const populateCreated = "created_by";
const populateEstablish = ["-establishments", "-pass"];

@injectable()
@registry([
    {
        token: `IAccountRepository`,
        useToken: delay(() => MongoAccountRepository)
    }
])
export default class MongoAccountRepository implements IAccountRepository {

    constructor(
        @inject('IOrderRepository') private readonly orderRepository : IOrderRepository
    ) {}

    addNew(newAccount: IAccount): Promise<IAccount> {
        return Accounts.create(newAccount);
    }

    async accountIsOpen(id: string): Promise<boolean> {
        return (await Accounts.findById(id, {status: -1})).status === "open"
    }

    update(id: string, data: object): Promise<IAccount> {
        return Accounts.findByIdAndUpdate(id, data, {new: true});
    }


    findAll(query: IAccountSearch): Promise<IAccount[]> {
        query.deleted_id = null;
        if (typeof(query.status) === "object") {
            query.status = {
                $in: query.status
            }
        }
        return Accounts.find(query).populate(populateCreated, populateEstablish);
    }
    
    async delete(id: string): Promise<IAccount> {
        
        const checkData = await this.findOne(id);

        if (checkData.payments.length) {
            throw new BadRequestError("Conta não pode ser excluida, conta possui recebimentos");
        }
        if (checkData.orders.length) {
            throw new BadRequestError("Conta não pode ser excluida, conta possui pedidos realizados");
        }
        return Accounts.findByIdAndUpdate(id, {
            deleted_id: id
        })
    }

    async findOne(accountId: string): Promise<Receipt> {

        const account = await Accounts.findById(accountId);
        if (!account)
            throw new NotFoundError("Conta não foi localizada")

        const data = await Promise.all([
            this.orderRepository.findAll({
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
            storeCode: account.storeCode,
            description: account.description,
            client: account.client,
            orders: ords.map((e) => <IReceiptOrders>{
                _id: e._id,
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
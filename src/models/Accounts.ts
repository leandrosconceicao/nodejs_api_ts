import mongoose from "mongoose";
import { clientBasicInfoSchema, clientsBasicInfoValidation, IClientBasicInfo } from "./Clients";
import {z} from "zod";
import { idValidation } from "../utils/defaultValidations";
import MongoId from "./custom_types/mongoose_types";

var ObjectId = mongoose.Types.ObjectId;

class Receipt implements IReceipt {
    _id: mongoose.Types.ObjectId | string;
    description: string;
    payments: Array<IReceiptPayments>;
    orders: Array<IReceiptOrders>
    totalOrder?: number;
    totalProducts?: number;
    storeCode: mongoose.Types.ObjectId | string;
    totalPayment?: number;
    totalTip?: number;
    allProductsHasTipValue?: boolean;
    client?: IClientBasicInfo;
    subTotal?: number;
}

interface IReceipt {
    _id: mongoose.Types.ObjectId | string;
    storeCode: mongoose.Types.ObjectId | string,
    description: string,
    payments: Array<IReceiptPayments>,
    orders: Array<IReceiptOrders>
    totalOrder?: number,
    totalProducts?: number,
    totalPayment?: number,
    totalTip?: number,
    client?: IClientBasicInfo,
    subTotal?: number;
}
interface IReceiptOrders {
    _id: string | mongoose.Types.ObjectId,
    products: Array<IReceiptOrdersProducts>
    totalTip?: number,
    discount?: number,
    totalProduct?: number
    subTotal?: number,
}

interface IReceiptOrdersProducts {
    quantity: number,
    subTotal: number,
    totalProduct: number,
    productName: string,
    category: string,
    unitPrice: number,
    tipValue: number,
    addOnes: Array<IReceiptOrdersProductsAddOnes>
}

interface IReceiptOrdersProductsAddOnes {
    name: string
    quantity?: number,
    price?: number
}

interface IReceiptPayments {
    method: mongoose.Types.ObjectId,
    total: number,
    description?: string
}

const accountStatus = ['open', 'closed', 'checkSolicitation'];

const accountValidation = z.object({
    description: z.string().min(1),
    storeCode: idValidation.optional(),
    updateAt: z.date().optional(),
    status: z.enum(["open", "closed", "checkSolicitation"]).optional(),
    client: clientsBasicInfoValidation.optional(),
    created_by: idValidation.optional()
});

enum AccountStatus {
    open = 'open',
    closed = 'closed',
    checkSolicitation = 'checkSolicitation'
}

interface IAccount {
    _id?: string | mongoose.Types.ObjectId,
    deleted_id?: object,
    description: string,
    storeCode: string | MongoId,
    createdAt?: Date,
    updatedAt?: Date,
    status: AccountStatus | string,
    client?: IClientBasicInfo,
    created_by: string | MongoId,
}

interface IAccountSearch {
    deleted_id?: object,
    _id?: string | mongoose.Types.ObjectId
    description?: object,
    storeCode?: string | mongoose.Types.ObjectId
    createdAt?: object,
    status?: string | string[] | object,
    createdBy?: string | mongoose.Types.ObjectId
}

const accountSchema = new mongoose.Schema({
    deleted_id: {type: ObjectId, default: undefined},
    description: { type: String, required: [true, "Parametro (description) é obrigatório"] },
    storeCode: { 
        type: ObjectId, 
        ref: 'establishments',
        required: [true, "Parametro (storeCode) é obrigatório"] 
    },
    status: {
        type: String,
        required: true,
        default: 'open',
        enum: {
            values: accountStatus,
            message: "O tipo {VALUE} não é um valor de STATUS permitido"
        }
    },
    client: {
        type: clientBasicInfoSchema
    },
    created_by: {
        type: ObjectId, ref: 'users', required: [true, "Parametro (created_by) é obrigatório"]
    },
}, {
    timestamps: true
});

accountSchema.virtual('orders');
accountSchema.virtual('payments');

const Accounts = mongoose.model<IAccount>("accounts", accountSchema)


export {accountStatus, Accounts, accountValidation, Receipt, IAccount, IReceiptOrders, IReceiptPayments, AccountStatus, IAccountSearch};
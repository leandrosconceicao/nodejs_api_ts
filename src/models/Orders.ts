import mongoose from "mongoose";
import {z} from "zod";
import orders_products_schema from "./orders/orders_products";
import { clientsSchema, IClient } from "./Clients";
import { idValidation } from "../utils/defaultValidations";
import MongoId from "./custom_types/mongoose_types";
import { IUsers } from "./Users";
import { IAccount } from "./Accounts";
import { IEstablishments } from "./Establishments";
import { IPayment } from "./Payments";
var ObjectId = mongoose.Types.ObjectId;

const orderSchema = new mongoose.Schema({
  pedidosId: { type: Number },
  firebaseToken: {type: String},
  accountId: {
    type: ObjectId, ref: "accounts",
  },
  discount: { 
    type: Number,
    default: 0.0,
    validate: {
      validator: function (data: number) {
        return data >= 0 && data <= 100;
      },
      message: "O valor do desconto não pode ultrapassar 100%"
    }
  },
  updated_at: { type: Date },
  updated_by: { type: ObjectId, ref: "users"},
  orderType: {
    type: String,
    default: 'frontDesk',
    enum: {
      values: ['frontDesk', 'account', 'delivery', 'withdraw'],
      message: "O tipo {VALUE} não é um valor permitido"
    }
  },
  accepted: { type: Boolean, default: null },
  status: {
    type: String,
    default: "pending",
    enum: {
      values: ['pending', 'cancelled', 'finished', 'onTheWay'],
      message: "o status {VALUE} não é um valor permitido"
    }
  },
  products: {
    type: [
      orders_products_schema,
    ],
    validate: {
      validator: function (data: Array<any>) {
        return data.length;
      },
      message: ""
    }
  },
  client: {
    type: clientsSchema
  },
  createdBy: {
    type: ObjectId, ref: "users",
  },
  storeCode: {type: ObjectId, ref: "establishments" , required: [true, "Parametro (storeCode) é obrigatório"]},
  paymentMethod: {
    type: ObjectId,
    ref: "paymentMethods",
  },
}, {
  timestamps: true
});

orderSchema.pre("save", function(next) {
  this.discount = this.discount / 100;
  next();
})

orderSchema.virtual("userCreate", {
  ref: 'users',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true
})

orderSchema.virtual("accountDetail", {
  ref: 'accounts',
  localField: 'accountId',
  foreignField: '_id',
  justOne: true
})

orderSchema.virtual("storeCodeDetail", {
  ref: 'establishments',
  localField: 'storeCode',
  foreignField: '_id',
  justOne: true
})

orderSchema.virtual("paymentMethodDetail", {
  ref: 'paymentMethods',
  localField: 'paymentMethod',
  foreignField: '_id',
  justOne: true
})

orderSchema.virtual("paymentDetail", {
  ref: 'payments',
  localField: '_id',
  foreignField: 'orderId',
  justOne: true
})

orderSchema.virtual("subTotal")
  .get(function() {
    const total = this.products.reduce((a, b) => a + (b.subTotal), 0.0)
    return total - (total * this.discount);
  })

orderSchema.virtual("totalProduct")
  .get(function() {
    const total = this.products.reduce((a, b) => a + (b.totalProduct), 0.0)
    return total;
  })

orderSchema.set('toObject', { virtuals: true });
orderSchema.set('toJSON', { virtuals: true });

const orderProductValidation = z.object({
  quantity: z.number(),
  productName: z.string().optional(),
  productId: idValidation,
  orderDescription: z.string().optional(),
  category: z.string().optional(),
  needsPreparation: z.boolean().optional(),
  setupIsFinished: z.boolean().optional(),
  observations: z.string().default(""),
  unitPrice: z.number(),
  tipValue: z.number().optional(),
  hasTipValue: z.boolean().optional(),
  addOnes: z.array(z.object({
      addOneName: z.string(),
      quantity: z.number(),
      price: z.number(),
      name: z.string(),
  }).optional()).optional()
});

const orderValidation = z.object({
  pedidosId: z.number().optional(),
  firebaseToken: z.string().optional(),
  accountId: idValidation.optional(),
  updated_by: idValidation.optional(),
  orderType: z.enum(['frontDesk', 'account', 'delivery', 'withdraw']).default("frontDesk"),
  accepted: z.boolean().optional(),
  status: z.enum(['pending', 'cancelled', 'finished', 'onTheWay']).default("pending"),
  discount: z.number().nonnegative({
    message: "Informe um valor entre 0 e 100"
}).default(0.0),
  products: z.array(orderProductValidation).nonempty(),
  client: z.object({
      cgc: z.string().optional(),
      name: z.string().optional(),
      email: z.string().optional(),
      phoneNumber: z.string().optional(),
      address: z.array(z.object({
          address: z.string().optional(),
          city: z.string().optional(),
          complement: z.string().optional(),
          district: z.string().optional(),
          number: z.string().optional(),
          state: z.string().optional(),
          zipCode: z.string().optional()
      })).nonempty().optional(),
  }).default({
    cgc: "",
    name: "",
    email: "",
    phoneNumber: "",
  }),
  createdBy: idValidation.optional(),
  storeCode: idValidation,
  paymentMethod: idValidation.optional(),
});

enum OrderStatus {
  pending = 'pending', 
  cancelled = 'cancelled', 
  finished = 'finished', 
  onTheWay = 'onTheWay'
}

enum OrderType {
  frontdesk = 'frontDesk', 
  account = 'account',
  delivery = 'delivery',
  withdraw = 'withdraw'
}

interface IOrderProduct {
  quantity: number,
  productName?: string,
  productId: string | MongoId,
  orderDescription?: string,
  observations: string,
  category?: string,
  needsPreparation?: boolean,
  setupIsFinished?: boolean,
  unitPrice: number,
  tipValue?: number,
  hasTipValue?: boolean,
  subTotal?: number,
  totalProduct?: number,
  addOnes?: Array<IAddOne>      
}

interface IAddOne {
  _id?: any,
  addOneName: string,
  quantity: number,
  price: number,
  name: string,
}

interface IOrder {
  _id: string | MongoId,
  pedidosId?: number,
  firebaseToken?: string,
  accountId: string | MongoId,
  orderType?: OrderType,
  accepted?: boolean,
  discount?: number,
  status?: OrderStatus,
  products: Array<IOrderProduct>,
  client?: IClient,
  createdBy?: string | MongoId,
  updatedBy?: string | MongoId,
  storeCode: string | MongoId,
  paymentMethod: string | MongoId,
  createdAt?: Date,
  userCreate?: IUsers,
  accountDetail?: IAccount, 
  storeCodeDetail?: IEstablishments,
  paymentDetail?: IPayment
  subTotal?: number,
  totalProduct?: number
}

interface IFirebaseOrder {
  _id: string,
  pedidosId?: number,
  firebaseToken?: string,
  accountId: string,
  orderType?: OrderType,
  accepted?: boolean,
  discount?: number,
  status?: OrderStatus,
  products: Array<Partial<IOrderProduct>>,
  client?: IClient,
  createdBy?: string,
  updatedBy?: string,
  storeCode: string,
  paymentMethod: string,
  createdAt?: string,
  createDate?: string,
  userCreate?: Partial<IUsers>,
  accountDetail?: Partial<IAccount>, 
  storeCodeDetail?: Partial<IEstablishments>
  subTotal?: number,
  totalProduct?: number
}

const Orders = mongoose.model<IOrder>("orders", orderSchema);

export {Orders, orderSchema, orderValidation, orderProductValidation, IOrder, IFirebaseOrder, OrderType, OrderStatus, IOrderProduct, IAddOne};
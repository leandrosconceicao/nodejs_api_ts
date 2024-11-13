import mongoose from "mongoose";
import {z} from "zod";
import orders_products_schema from "./orders/orders_products";
import orders_delivery_address from "./orders/orders_delivery_address";
import { clientsSchema } from "./Clients";
import { idValidation } from "../utils/defaultValidations";
import { paymentValidation } from "./Payments";
import MongoId from "./custom_types/mongoose_types";
var ObjectId = mongoose.Types.ObjectId;

const orderSchema = new mongoose.Schema({
  pedidosId: { type: Number },
  firebaseToken: {type: String},
  accountId: {
    type: ObjectId, ref: "accounts",
  },
  createDate: { type: Date , default: () => {return new Date();}},
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
    type: "String",
    default: "pending",
    enum: {
      values: ['pending', 'cancelled', 'finished', 'onTheWay'],
      message: "o status {VALUE} não é um valor permitido"
    }
  },
  products: {
    type: [
      orders_products_schema
    ],
  },
  isPayed: { type: Boolean, default: false },
  client: {
    type: clientsSchema
  },
  deliveryAddress: {
    type: orders_delivery_address,
  },
  observations: {type: String, default: ""},
  userCreate: {
    type: ObjectId, ref: "users",
  },
  storeCode: {type: ObjectId, ref: "establishments" , required: [true, "Parametro (storeCode) é obrigatório"]},
  payment: {
    type: mongoose.Types.ObjectId, ref: 'payments'
  },
  paymentMethod: {
    type: ObjectId,
    ref: "paymentMethods",
  },
  dateDiff: {}
});

const orderProductValidation = z.object({
  quantity: z.number(),
  productName: z.string().optional(),
  productId: idValidation,
  orderDescription: z.string().optional(),
  category: z.string().optional(),
  needsPreparation: z.boolean().optional(),
  setupIsFinished: z.boolean().optional(),
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
  accountId: idValidation.optional(),
  firebaseToken: z.string().optional(),
  accepted: z.boolean().optional(),
  status: z.enum(['pending', 'cancelled', 'finished', 'onTheWay']).optional(),
  orderType: z.enum(['frontDesk', 'account', 'delivery', 'withdraw']).optional(),
  isPayed: z.boolean().optional(),
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
      })).optional(),
  }),
  userCreate: idValidation.optional(),
  observations: z.string().optional(),
  storeCode: idValidation,
  payment: paymentValidation.optional(),
  paymentMethod: idValidation.optional(),
  products: z.array(orderProductValidation).nonempty(),
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

interface IOrder {
  _id: MongoId,
  pedidosId?: number,
  firebaseToken?: string,
  accountId?: {
    description?: string
  },
  // accepted?: string,
  status?: OrderStatus,
  createDate?: Date,
  orderType?: OrderType,
  client?: {
    cgc?: string,
    name?: string,
    email?: string,
    phoneNumber?: string,
    address?: Array<{
      address?: string,
      city?: string,
      complement?: string,
      district?: string,
      number?: string,
      state?: string,
      zipCode?: string,
    }>
  },
  userCreate?: {
    username: string
  },
  observations?: string,
  storeCode: MongoId,
  payment?: {
    accountId?: MongoId,
    cashRegisterId: MongoId,
    userCreate: MongoId,
    value: {
      method: {
        description: string,
        _id: MongoId
      },
      value: number
    }
  },
  products: Array<{
    quantity: number,
    productName?: string,
    productId: MongoId,
    orderDescription?: string,
    category?: string,
    needsPreparation?: boolean,
    setupIsFinished?: boolean,
    unitPrice: number,
    tipValue?: number,
    hasTipValue?: boolean,
    subTotal?: number,
    addOnes?: Array<{
      addOneName: string,
      quantity: number,
      price: number,
      name: string,
    }>      
  }>,
}

interface IFirebaseOrder {
  _id: string,
  pedidosId?: number,
  firebaseToken?: string,
  accountId?: {
    description?: string
  },
  // accepted?: string,
  status?: OrderStatus,
  createDate?: string,
  orderType?: OrderType,
  client?: {
    cgc?: string,
    name?: string,
    email?: string,
    phoneNumber?: string,
    address?: Array<{
      address?: string,
      city?: string,
      complement?: string,
      district?: string,
      number?: string,
      state?: string,
      zipCode?: string,
    }>
  },
  userCreate?: {
    username: string
  },
  observations?: string,
  storeCode: string,
  payment?: {
    accountId?: string,
    cashRegisterId: string,
    userCreate: string,
    value: {
      method: {
        description: string,
        _id: string
      },
      value: number
    }
  },
  products: Array<{
    quantity: number,
    productName?: string,
    productId: string,
    orderDescription?: string,
    category?: string,
    needsPreparation?: boolean,
    setupIsFinished?: boolean,
    unitPrice: number,
    tipValue?: number,
    hasTipValue?: boolean,
    subTotal?: number,
    addOnes?: Array<{
      addOneName: string,
      quantity: number,
      price: number,
      name: string,
    }>      
  }>,
}

const Orders = mongoose.model("orders", orderSchema);

export {Orders, orderSchema, orderValidation, orderProductValidation, IOrder, IFirebaseOrder, OrderType, OrderStatus};
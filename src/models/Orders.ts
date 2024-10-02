import mongoose from "mongoose";
import {z} from "zod";
import orders_products_schema from "./orders/orders_products";
import orders_delivery_address from "./orders/orders_delivery_address";
import { clientsSchema } from "./Clients";
import { idValidation } from "../utils/defaultValidations";
import { paymentValidation } from "./Payments";
var ObjectId = mongoose.Types.ObjectId;

const orderSchema = new mongoose.Schema({
  pedidosId: { type: Number },
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
  hasTipValue: z.boolean().default(false),
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
  products: z.array(orderProductValidation).nonempty(),
});

const Orders = mongoose.model("orders", orderSchema);

export {Orders, orderSchema, orderValidation, orderProductValidation};
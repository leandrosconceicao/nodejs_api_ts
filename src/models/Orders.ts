import mongoose from "mongoose";
import orders_products_schema from "./orders/orders_products";
import orders_delivery_address from "./orders/orders_delivery_address";
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
      values: ['frontDesk', 'account', 'delivery'],
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
    type: ObjectId, ref: "clients"
  },
  deliveryAddress: {
    type: orders_delivery_address,
  },
  observations: {type: String, default: ""},
  userCreate: {
    type: ObjectId, ref: "users", required: [true, "Parametro (userCreate) é obrigatório"],
  },
  storeCode: {type: ObjectId, ref: "establishments" , required: [true, "Parametro (storeCode) é obrigatório"]},
  payment: {
    type: mongoose.Types.ObjectId, ref: 'payments'
  },
  dateDiff: {}
});

const Orders = mongoose.model("orders", orderSchema);

export {Orders, orderSchema};
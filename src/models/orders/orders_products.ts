import mongoose from "mongoose";
import { IOrderProduct } from "../Orders";
var ObjectId = mongoose.Types.ObjectId;
 
const orders_products_schema = new mongoose.Schema<IOrderProduct>({
  quantity: {type: Number, required: [true, "Parametro (products[].quantity) é obrigatório"]},
  productName: {type: String, default: ""},
  productId: {type: ObjectId, required: [true, "Parametro (products[].productId) é obrigatório"]},
  orderDescription: {type: String, default: ""},
  category: {type: String, default: ""},
  needsPreparation: {type: Boolean, default: true},
  setupIsFinished: {type: Boolean, default: false},
  observations: {type: String, default: ""},
  unitPrice: {type: Number, required: [true, "Parametro (products[].unitPrice) é obrigatório"]},
  tipValue: {
    type: Number,
    default: 0.0
  },
  addOnes: {
    type: [
      {
        _id: String,
        addOneName: String,
        quantity: Number,
        name: String,
        price: Number,
      },
    ],
    default: undefined,
  },
})

orders_products_schema.virtual("subTotal")
  .get(function() {
    let subTotal = this.totalProduct;
    return subTotal + (this.tipValue * subTotal)
  })

  orders_products_schema.virtual("totalAddOnes")
    .get(function() {
      let sub = this.addOnes?.reduce((a, b) => a + (b.price * b.quantity), 0.0)
      return sub;
    })

orders_products_schema.virtual("totalProduct")
  .get(function() {
    let subTotal = (this.quantity * this.unitPrice) + this.totalAddOnes;
    return subTotal
  })

orders_products_schema.set('toObject', { virtuals: true });
orders_products_schema.set('toJSON', { virtuals: true });

export default orders_products_schema;
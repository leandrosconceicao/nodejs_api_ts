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
orders_products_schema.virtual("totalTip").get(
  function() {
    const totalProd = (this.totalProduct ?? 0.0);
    const totalTip = (this.tipValue ?? 0.0) * totalProd;
    return parseFloat(totalTip.toFixed(2));
  }
)

orders_products_schema.virtual("subTotal")
  .get(function() {
    let subTotal = this.totalProduct ?? 0.0;
    return subTotal + this.totalTip
  })

  orders_products_schema.virtual("totalAddOnes")
    .get(function() {
      let sub = this.addOnes?.reduce((a, b) => a + ((b.price ?? 0.0) * (b.quantity ?? 0.0)), 0.0)
      return sub ?? 0.0;
    })

orders_products_schema.virtual("totalProduct")
  .get(function() {
    let subTotal = (this.quantity * this.unitPrice) + this.totalAddOnes;
    return subTotal
  })

orders_products_schema.set('toObject', { virtuals: true });
orders_products_schema.set('toJSON', { virtuals: true });

export default orders_products_schema;
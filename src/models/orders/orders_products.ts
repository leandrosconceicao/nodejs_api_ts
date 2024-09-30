import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;
 
const orders_products_schema = new mongoose.Schema({
    quantity: {type: Number, required: [true, "Parametro (products[].quantity) é obrigatório"]},
    productName: {type: String, default: ""},
    productId: {type: ObjectId, required: [true, "Parametro (products[].productId) é obrigatório"]},
    orderDescription: {type: String, default: ""},
    category: {type: String, default: ""},
    needsPreparation: {type: Boolean, default: true},
    setupIsFinished: {type: Boolean, default: false},
    tipValue: {
      type: Number,
      default: 0.0
    },
    unitPrice: {type: Number, required: [true, "Parametro (products[].unitPrice) é obrigatório"]},
    addOnes: {
      type: [
        {
          addOneName: String,
          quantity: Number,
          name: String,
          price: Number,
        },
      ],
      default: undefined,
    },
  })

//   orders_products_schema.virtual("subTotal")
//     .get(function() {
//       let subTotal = (this.quantity * this.unitPrice);
//       return subTotal + (this.tipValue * subTotal)
//     })
// orders_products_schema.set('toObject', { virtuals: true });
// orders_products_schema.set('toJSON', { virtuals: true });

export default orders_products_schema;
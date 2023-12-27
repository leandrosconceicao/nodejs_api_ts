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

  export default orders_products_schema;
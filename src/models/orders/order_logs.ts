import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;

export default new mongoose.Schema({
  orderId: {
    type: ObjectId,
    ref: "orders",
    required: [true, "Informe o id do pedido"],
  },
  description: {
    type: String,
    required: [true, "Informe a descrição da ocorrência"],
  },
  storeCode: {
    type: mongoose.Types.ObjectId,
    ref: "establishments",
    required: [true, "Parametro (storeCode) é obrigatório"],
  },
  userCreate: {
    type: ObjectId,
    ref: "users",
    required: [true, "Parametro (userCreate) é obrigatório"],
  },
});

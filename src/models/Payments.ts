import mongoose from "mongoose";
var ObjectId = mongoose.Types.ObjectId;

const valueSchema = new mongoose.Schema({
    txId: { type: String, default: undefined },
    cardPaymentId: { type: String, default: undefined },
    form: {
        type: String,
        default: 'money',
        enum: {
            values: ['money', 'debit', 'credit', 'pix'],
            message: "O tipo {VALUE} não é um valor permitido"
        },
    },
    value: { type: Number, required: [true, "Parametro (value) é obrigatório"] },
});

const paymentSchema = new mongoose.Schema({
    accountId: {
        type: ObjectId, ref: 'accounts'
    },
    refunded: { type: Boolean, default: false },
    storeCode: { type: ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"] },
    userCreate: { type: ObjectId, ref: "users", required: [true, "Parametro (userCreate) é obrigatório"] },
    createDate: { type: Date, default: () => { return new Date() }, required: [true, "Parametro (createDate) é obrigatório"] },
    userUpdated: { type: ObjectId, ref: "users", },
    updateDate: { type: Date },
    value: valueSchema
});



const Payments = mongoose.model("payments", paymentSchema);

export { paymentSchema, Payments };
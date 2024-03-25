import mongoose from 'mongoose';

const categorieSchema = new mongoose.Schema({
    // _id: {type: Number},
    nome: {type: String, required: [true, "Parametro (nome) é obrigatório"], unique: true},
    storeCode: {type: mongoose.Types.ObjectId, ref: "establishments", required: [true, "Parametro (storeCode) é obrigatório"]},
    ordenacao: {type: Number, required: [true, "Parametro (ordenacao) é obrigatório"]},
    createDate: {type: Date, default: () => { return new Date() }},
    image: {type: String}
});

const categories = mongoose.model('categories', categorieSchema)

export default categories;

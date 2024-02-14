import mongoose from "mongoose";

const salesSchema = new mongoose.Schema({
    _id: {type: mongoose.Types.ObjectId},
    total: {type: Number},
    date: {type: Date},
    storeCode: {type: mongoose.Types.ObjectId}

})
// const menuItems = mongoose.model('menuItems', menuItemsSchema, 'categorias')
const TotalSales = mongoose.model('totalSales', salesSchema, 'orders')

export default TotalSales;
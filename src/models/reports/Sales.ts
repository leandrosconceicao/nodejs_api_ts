import mongoose from "mongoose";
import { IProduct } from "../products/Products";

const salesSchema = new mongoose.Schema({
    _id: {type: mongoose.Types.ObjectId},
    total: {type: Number},
    date: {type: Date},
    storeCode: {type: mongoose.Types.ObjectId}

})

interface ITotalSales {
    _id: string;
    orderType: string,
    pedidosId: number,
    createdAt: Date,
    total: number;
    quantity: number;
    discount: number;
    storeCode: string;
    products: Array<IProduct>;
}
// const menuItems = mongoose.model('menuItems', menuItemsSchema, 'categorias')
const TotalSales = mongoose.model('totalSales', salesSchema, 'orders')

export {TotalSales, ITotalSales};
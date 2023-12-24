import mongoose from "mongoose";

export default mongoose.model(
    "establishmentsCheck", new mongoose.Schema({
        products: [],
        orders: [],
        payments: [],
        accounts: [],
        categories: []
    }), 'establishments'
);
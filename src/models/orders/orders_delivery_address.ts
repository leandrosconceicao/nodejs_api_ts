import mongoose from "mongoose";

export default new mongoose.Schema({
    name: { type: String },
    phoneNumber: { type: String },
    address: { type: String },
    city: { type: String },
    complement: { type: String },
    distric: { type: String },
    number: { type: String },
    state: { type: String },
    zipCode: { type: String }
})
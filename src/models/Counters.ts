import mongoose, { Schema } from "mongoose";
var ObjectId = mongoose.Types.ObjectId;

export default mongoose.model("counters", new Schema({
    seq_value: { type: Number },
    createDate: { type: Date },
    storeCode: { type: ObjectId, ref: 'counters' }
}))
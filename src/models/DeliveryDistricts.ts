import mongoose from "mongoose";
import { IDeliveryDistrict } from "../domain/types/IDeliveryDistrict";

var ObjectId = mongoose.Types.ObjectId;

const deliveryDistrictsSchema = new mongoose.Schema({
    storeCode: {
        type: ObjectId,
        ref: "establishments",
        required: [true, "Parametro (storeCode) é obrigatório"],
    },
    description: String,
    value: Number,
    deleted: { type: Boolean, default: undefined }
}, {
    timestamps: true
});

deliveryDistrictsSchema.index({ storeCode: 1, description: 1 }, { unique: true, partialFilterExpression: { deleted: null } });

export const DeliveryDistrict = mongoose.model<IDeliveryDistrict>('deliveryDistricts', deliveryDistrictsSchema);
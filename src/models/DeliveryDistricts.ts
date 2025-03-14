import mongoose from "mongoose";
import { IDeliveryDistrict } from "../domain/types/IDeliveryDistrict";

var ObjectId = mongoose.Types.ObjectId;

const districtSchema = new mongoose.Schema({
    description: String,
    value: Number
}, {
    timestamps: true
});

const deliveryDistrictsSchema = new mongoose.Schema({
    storeCode: {
        type: ObjectId,
        ref: "establishments",
        required: [true, "Parametro (storeCode) é obrigatório"],
    },
    districts: {
        type: [
            districtSchema
        ],
        validate: {
        validator: function (data: Array<any>) {
            return data.length;
        },
        message: ""
        }
    },
    deleted: { type: Boolean, default: undefined }
}, {
    timestamps: true
});

deliveryDistrictsSchema.index({ storeCode: 1 }, { unique: true, partialFilterExpression: { deleted: null } });

export const DeliveryDistrict = mongoose.model<IDeliveryDistrict>('deliveryDistricts', deliveryDistrictsSchema);
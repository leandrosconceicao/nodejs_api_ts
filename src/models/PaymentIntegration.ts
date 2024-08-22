import mongoose from "mongoose";
import {z} from "zod";
var ObjectId = mongoose.Types.ObjectId;

const paymentSchemaValidation = z.object({
    description: z.string().min(1),
    tag: z.string().min(1).refine(s => !s.includes(' ')),
});

const PaymentIntegration = mongoose.model("integrations", new mongoose.Schema({
    description: {
        type: String,
        required: true,
    },
    tag: {
        type: String,
        required: true,
        unique: true,
    },
    enabled: {
        type: Boolean,
        default: true
    },
    deleted: {
        type: ObjectId,
    }
}, {
    timestamps: true
}));

export {paymentSchemaValidation, PaymentIntegration}
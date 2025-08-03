import mongoose from "mongoose";
import { clientBasicInfoSchema, clientsSchema, deliveryAddressSchema } from "../Clients";
import orders_products_schema from "./orders_products";
import { IDeliveryOrder } from "../../domain/types/IDeliveryOrder";

var ObjectId = mongoose.Types.ObjectId;

const deliveryOrdersSchema = new mongoose.Schema({
    orderId: {
      type: ObjectId,
      ref: "orders",
    },
    storeCode: {
        type: ObjectId,
        ref: "establishments",
        required: [true, "Parametro (storeCode) é obrigatório"]
    },
    client: clientBasicInfoSchema,
    deliveryAddress: deliveryAddressSchema,
    deliveryTax: Number,
    status: {
        type: String,
        default: 'pending',
        enum: {
            values: ["pending", "accepted", "cancelled", "onTheWay"],
            message: "O status {VALUE} não é um valor permitido"
        }
    },
    paymentMethod: {
        required: [true, "Parametro (paymentMethod) é obrigatório"],
        type: ObjectId,
        ref: "paymentMethods",
    },
    products: {
        type: [
          orders_products_schema,
        ],
        validate: {
          validator: function (data: Array<any>) {
            return data.length;
          },
          message: ""
        }
      },
}, {
    timestamps: true
})

deliveryOrdersSchema.virtual('paymentMethodDetail', {
  justOne: true,
  ref: "paymentMethods",
  localField: 'paymentMethod',
  foreignField: "_id"
});

deliveryOrdersSchema.virtual('establishmentDetail', {
  justOne: true,
  ref: "establishments",
  localField: 'storeCode',
  foreignField: "_id"
});

deliveryOrdersSchema.virtual('subTotal')
  .get(function () {
    const total = this.products.reduce((a, b) => a + (b.subTotal ?? 0.0), 0.0) + (this.deliveryTax ?? 0.0);
    return total;
  })

deliveryOrdersSchema.set('toObject', { virtuals: true });
deliveryOrdersSchema.set('toJSON', { virtuals: true });

export const DeliveryOrders = mongoose.model<IDeliveryOrder>('deliveryOrders', deliveryOrdersSchema)
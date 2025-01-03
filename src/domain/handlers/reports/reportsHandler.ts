import { DateQuery, PeriodQuery } from "../../../utils/PeriodQuery";
import mongoose from "mongoose";
import { IPaymentsByMethods } from "../../../models/reports/Payments";
import { PaymentMethods } from "../../../models/PaymentMethods";
import { CashRegister } from "../../../models/CashRegister";
import { Orders } from "../../../models/Orders";
import { Payments } from "../../../models/Payments";

var ObjectId = mongoose.Types.ObjectId;

export default class ReportHandler {

    getPaymentsByMethods = async (query: {
        storeCode?: string,
        from?: string,
        to?: string
    }) => {
        const filters: {
            storeCode: mongoose.Types.ObjectId,
            createDate: DateQuery
        } = {
            storeCode: new ObjectId(query.storeCode),
            createDate: new PeriodQuery(query.from, query.to).build()
        }

        return PaymentMethods.aggregate<IPaymentsByMethods>([
            {
              '$match': {
                'storeCode': new ObjectId(filters.storeCode)
              }
            }, {
              '$lookup': {
                'from': 'payments', 
                'localField': '_id', 
                'foreignField': 'method', 
                'as': 'payments', 
                'pipeline': [
                  {
                    '$match': {
                      'createdAt': filters.createDate
                    }
                  }
                ]
              }
            }, {
              '$addFields': {
                'total': {
                  '$sum': '$payments.total'
                }
              }
            }, {
              '$project': {
                'description': 1, 
                'total': 1, 
                'payments.total': 1, 
                'payments.orderId': 1, 
                'payments._id': 1
              }
            }
          ])
    }

    getCashRegister = async (id: mongoose.Types.ObjectId) => {
        return CashRegister.aggregate([
            {
              '$match': {
                '_id': id
              }
            }, {
              '$lookup': {
                'from': 'payments', 
                'localField': '_id', 
                'foreignField': 'cashRegisterId', 
                'as': 'payments'
              }
            }, {
              '$lookup': {
                'from': 'cashregistermovements', 
                'localField': '_id', 
                'foreignField': 'cashRegisterId', 
                'as': 'movements'
              }
            }, {
              '$lookup': {
                'from': 'cashregistercompares', 
                'localField': '_id', 
                'foreignField': 'cashId', 
                'as': 'movementCompare'
              }
            }, {
              '$addFields': {
                'totalPayments': {
                  '$sum': '$payments.total'
                }
              }
            }
          ])
    }

    getAnalyticData = async (storeCode: string, period: DateQuery) => {
      const data = await Promise.all([
        Orders.find({
          storeCode,
          createdAt: period,
          status: {
            $ne: "cancelled"
          }
        }),
        Payments.find({
          storeCode,
          createdAt: period
        })
      ])
      const orders = data[0] ?? [];
      const payments = data[1] ?? [];

      return {
        _id: storeCode,
        orders: orders,
        payments: payments,
        totalPayments: payments.reduce((a, b) => a + (b.total), 0.0),
        totalOrders: orders.reduce((a, b) => a + (b.subTotal), 0.0)
      }
    }
}
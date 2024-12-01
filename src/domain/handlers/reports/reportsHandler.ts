import { DateQuery, PeriodQuery } from "../../../utils/PeriodQuery";
import mongoose from "mongoose";
import { IPaymentsByMethods } from "../../../models/reports/Payments";
import { PaymentMethods } from "../../../models/PaymentMethods";
import { CashRegister } from "../../../models/CashRegister";
import { Establishments } from "../../../models/Establishments";

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
      return Establishments.aggregate([
        {
          '$match': {
            '_id': new ObjectId(storeCode)
          }
        }, {
          '$lookup': {
            'from': 'payments', 
            'localField': '_id', 
            'foreignField': 'storeCode', 
            'as': 'payments', 
            'pipeline': [
              {
                '$match': {
                  'createdAt': period
                }
              }
            ]
          }
        }, {
          '$lookup': {
            'from': 'orders', 
            'localField': '_id', 
            'foreignField': 'storeCode', 
            'as': 'orders', 
            'pipeline': [
              {
                '$match': {
                  'createdAt': period, 
                  'status': {
                    '$ne': 'cancelled'
                  }
                }
              }
            ]
          }
        }, {
          '$project': {
            'payments': 1,
            'orders': 1
          }
        }, {
          '$addFields': {
            'totalPayments': {
              '$sum': '$payments.total'
            }
          }
        }, {
          '$unwind': '$orders'
        }, {
          '$unwind': '$orders.products'
        }, {
          '$group': {
            '_id': '$_id',
            'payments': {
              '$first': '$payments'
            }, 
            'orders': {
              '$push': '$orders'
            }, 
            'totalPayments': {
              '$first': '$totalPayments'
            }, 
            'totalOrders': {
              '$sum': {
                '$multiply': [
                  '$orders.products.unitPrice', '$orders.products.quantity'
                ]
              }
            }
          }
        }
      ])
    }
}
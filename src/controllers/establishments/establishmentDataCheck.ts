import mongoose from "mongoose";
import EstablishmentCheck from "../../models/dataCheck"
var ObjectId = mongoose.Types.ObjectId;

interface ValueChecks {
  products: Array<any>,
  orders: Array<any>,
  payments: Array<any>,
  accounts: Array<any>,
  categories: Array<any>,
}

export default {
  async check(id: string) : Promise<Number> {
    const check = await EstablishmentCheck.aggregate([
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "storeCode",
          as: "products",
          pipeline: [
            {
              $match: {
                storeCode: new ObjectId(id),
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      {
        $lookup: {
          from: "orders",
          localField: "_id",
          foreignField: "storeCode",
          as: "orders",
          pipeline: [
            {
              $match: {
                storeCode: new ObjectId(id),
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      {
        $lookup: {
          from: "payments",
          localField: "_id",
          foreignField: "storeCode",
          as: "payments",
          pipeline: [
            {
              $match: {
                storeCode: new ObjectId(id),
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      {
        $lookup: {
          from: "accounts",
          localField: "_id",
          foreignField: "storeCode",
          as: "accounts",
          pipeline: [
            {
              $match: {
                storeCode: new ObjectId(id),
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "storeCode",
          as: "categories",
          pipeline: [
            {
              $match: {
                storeCode: new ObjectId(id),
              },
            },
            {
              $limit: 1,
            },
          ],
        },
      },
      {
        $project: {
          products: 1,
          orders: 1,
          payments: 1,
          accounts: 1,
          categories: 1,
          _id: 0,
        },
      },
    ]);
    const parsed = <ValueChecks> {
      products: check[0].products,
      accounts: check[0].accounts,
      categories: check[0].categories,
      orders: check[0].orders,
      payments: check[0].payments,
    }
    return parsed.products.length || parsed.orders.length || parsed.payments.length || parsed.accounts.length || parsed.categories.length
  },
};

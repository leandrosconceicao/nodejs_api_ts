import { IOrder } from "../models/Orders";
import { Payments } from "../models/Payments";
import {Request, Response, NextFunction} from "express";

async function deletePaymment(req: Request, res: Response, next: NextFunction) {
    const order = req.result as IOrder;

    try {
        await Payments.findOneAndDelete({
                orderId: order._id
            });
    } catch (e) {

    }
    next()
}

export {deletePaymment}
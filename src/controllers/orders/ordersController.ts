import mongoose from "mongoose";
import { Request, Response, NextFunction } from "express";
import { Validators } from "../../utils/validators";
import { Orders, orderSchema } from "../../models/Orders";
import ApiResponse from "../../models/base/ApiResponse";
import Users from "../../models/Users";
import Counters from "../../models/Counters";
import NotFoundError from "../../models/errors/NotFound";
import {Accounts} from "../../models/Accounts";
import Establishments from "../../models/Establishments";
import InvalidParameter from "../../models/errors/InvalidParameters";
import PaymentController from "../payments/paymentController";
import AccountsController from "../accounts/accountsController";

var ObjectId = mongoose.Types.ObjectId;

const populateClient = "client";
const popuAccId = "accountId";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";
export default class OrdersController {

    static async newOrder(req: Request, res: Response, next: NextFunction) {
        try {
            const { storeCode, products, orderType, payment }: { storeCode: string, products: Array<any>, orderType: string, payment: any ,} = req.body;
            const storeVal = new Validators("storeCode", storeCode, "string").validate();
            const productVal = new Validators("products", products, "array").validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            if (!productVal.isValid) {
                throw new InvalidParameter(productVal);
            }
            if (!products.length) {
                throw ApiResponse.badRequest("Nenhum produto adicionado");
            }
            const newOrder = new Orders(req.body);
            if (orderType && orderType === "frontDesk") {
                const pay = await PaymentController.savePayment(payment);
                newOrder.payment = pay._id as any;
            }
            if (req.body.accountId) {
                const canRecieveNewOrder = await AccountsController.canReceiveNewOrder(req.body.accoundId);
                if (!canRecieveNewOrder) {
                    throw ApiResponse.badRequest("Conta não pode receber pedidos pois não está com o status de (ABERTA).");
                }
            }
            const process = await newOrder.save();
            await updateId(process._id.toString(), storeCode);
            const updatedOrder = await Orders.findById(process._id)
                .populate(populateClient)
                .populate(popuAccId, [popuPayment, popuOrders])
                .populate(popuUser, [popuEstablish, popuPass]);
            return ApiResponse.success(updatedOrder).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async getOrdersFromAccount(accountId: string) {
        const data = await Orders.find({
            accoundId: new ObjectId(accountId),
            status: { $ne: "cancelled" }
        })
            .populate(populateClient)
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]);
        return data;
    }

    static async finishOrdersOnCloseAccount(accountId: string) {
        await Orders.updateMany({
            accoundId: new ObjectId(accountId)
        }, {
            $set: {
                status: "finished",
                "products.$[].setupIsFinished": true,
                updated_at: new Date()
            }
        })
    }
}

async function updateId(id: string, storeCode: string) {
    let count = 0;
    let counter = await Counters.find({
        storeCode: new ObjectId(storeCode)
    });
    if (!counter.length) {
        count += 1;
    } else {
        const value = counter[0];
        const now = new Date();
        if (value.createDate.toLocaleDateString() !== now.toLocaleDateString()) {
            count += 1;
        } else {
            count = value.seq_value + 1;
        }
    }
    await Orders.findByIdAndUpdate(id, {
        pedidosId: count
    });
    await Counters.updateMany({
        storeCode: new ObjectId(storeCode)
    }, {
        seq_value: count, createDate: new Date()
    }, {
        upsert: true
    })
}
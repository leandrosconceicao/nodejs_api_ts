import {Request, Response, NextFunction} from "express";
import { IOrder, IFirebaseOrder, OrderType, IOrderProduct} from "../models/Orders";
import {getDatabase} from "firebase-admin/database";
import ApiResponse from "../models/base/ApiResponse";
import FirebaseMessaging from "../utils/firebase/messaging";

const FBMESSAGING = new FirebaseMessaging();

const PREPARATION_PATH = "preparation";
const WITHDRAW_PATH = "withdraw";

function handlerOrder(order: IOrder) {
    const parsedOrder : Partial<IFirebaseOrder> = {
        pedidosId: order.pedidosId,
        _id: `${order._id}`,
        firebaseToken: `${order.firebaseToken ?? ""}`,
        orderType: order.orderType,
        status: order.status,
        createdAt: order.createdAt?.toISOString() ?? order.createdAt?.toISOString(),
        userCreate: {
            username: order.userCreate?.username ?? "Sistema"
        },
        accountDetail: {
            description: order.accountDetail?.description ?? ""
        },
        products: [
            ...order.products.map((e) => {
                const addOnes = e.addOnes?.length ? [...e.addOnes.map((a) => {
                    return {
                        addOneName: a.addOneName,
                        quantity: a.quantity,
                        name: a.name,
                        price: a.price
                    }
                })] : [];
                return <IOrderProduct>{
                    quantity: e.quantity,
                    productName: e.productName,
                    productId: e.productId,
                    observations: e.observations,
                    orderDescription: e.orderDescription,
                    needsPreparation: e.needsPreparation,
                    setupIsFinished: e.setupIsFinished,
                    category: e.category,
                    unitPrice: e.unitPrice,
                    addOnes: addOnes
                }
            })
        ]
    }
    return parsedOrder;
}

function addPreparationOrder(req: Request, res: Response, next: NextFunction) {
    try {
        const order : IOrder = req.result;
        const parsedOrder = handlerOrder(order);
        const db = getDatabase();
        db.ref(`${order.storeCode}`).child(PREPARATION_PATH).child(`${order._id}`).set(parsedOrder)
    } catch (e) {
        console.log(e);
    }
    next();
}

function manageWithDrawMonitor(req: Request, res: Response, next: NextFunction) {
    try {
        const order : IOrder = req.result;
        if (order.orderType === OrderType.withdraw) {
            const parsedOrder = handlerOrder(order);
            const db = getDatabase();
            db.ref(`${order.storeCode}`).child(WITHDRAW_PATH).child(`${order._id}`).set(parsedOrder)
        }        
    } catch (e) {
        console.log(e);
    }
    next();
}

function updateWithDrawMonitor(req: Request, res: Response, next: NextFunction) {
    try {
        const data : {
            isReady: boolean,
            order: IOrder
        } = req.result

        if (data.order.orderType === OrderType.withdraw) {
            const parsedOrder = handlerOrder(data.order);
            const db = getDatabase();
            db.ref(`${data.order.storeCode}`).child(WITHDRAW_PATH).child(`${data.order._id}`).update(parsedOrder)
        }        
    } catch (e) {
        console.log(e);
    }
    next();
}


function setOrderOnPreparation(req: Request, res: Response, next: NextFunction) {
    const data : {
        isReady: boolean,
        order: IOrder
    } = req.result
    try {
        const db = getDatabase();
        const ref = db.ref(`${data.order.storeCode}`).child(PREPARATION_PATH);
        if (data.isReady) {
            ref.child(`${data.order._id}`).remove();
            notifyClient("Alerta de pedido", "Pedido está pronto", data.order.firebaseToken)
        } else {
            ref.child(`${data.order._id}`).set(handlerOrder(data.order))
        }
    } catch (e) {
        console.log(e);
    }
    ApiResponse.success(data.order).send(res);
}

function notifyClient(title: string, body: string, token?: string) {
    if  (token) {
        FBMESSAGING.sendToUser(token, {title, body});
    }
}

export {addPreparationOrder, setOrderOnPreparation, manageWithDrawMonitor, updateWithDrawMonitor};
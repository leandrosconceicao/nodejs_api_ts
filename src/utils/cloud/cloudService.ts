import { delay, inject, injectable, registry } from "tsyringe";
import ICloudService, { INotification } from "../../domain/interfaces/ICloudService";
import {getStorage, getDownloadURL} from "firebase-admin/storage";
import { getDatabase, Reference } from "firebase-admin/database";
import { messaging } from "firebase-admin";
import ErrorAlerts from "../errorAlerts";
import ISpoolHandler from "../../domain/interfaces/ISpoolHandler";
import { IPrinterSpool } from "../../domain/types/IPrinterSpool";
import { Message } from "firebase-admin/lib/messaging/messaging-api";
import { IFirebaseOrder, IOrder, IOrderProduct, OrderType } from "../../models/Orders";
import IPrinterRepository from "../../domain/interfaces/IPrinterRepository";
import NotFoundError from "../../models/errors/NotFound";
import { ISender } from "../../domain/interfaces/ISender";

const PREPARATION_PATH = "preparation";
const WITHDRAW_PATH = "withdraw";
const SPOOL_PATH = "spool";
const enviroment = process.env.ENVIROMENT;
const isDevelopment = enviroment === "development";

@injectable()
@registry([
    {
        token: "ICloudService",
        useToken: delay(() => CloudService)
    }
])
export default class CloudService implements ICloudService {

    constructor(
        @inject('ISpoolHandler') private readonly spoolHandler: ISpoolHandler,
        @inject("IPrinterRepository") private readonly printerRepository: IPrinterRepository,
        @inject("ISender") private readonly sender: ISender
    ) {}

    async removePreparationOrder(order: IOrder): Promise<void> {
        const db = getDatabase();
        (isDevelopment ? db.ref(enviroment).child(`${order.storeCode}`) : db.ref(`${order.storeCode}`)).child(PREPARATION_PATH).child(`${order._id}`).remove()
    }

    async updateWithdrawOrder(order: IOrder): Promise<void> {
        if (order.orderType === OrderType.withdraw) {
            const parsedOrder = this.handlerOrder(order);
            const db = getDatabase();
            (isDevelopment ? db.ref(enviroment).child(`${order.storeCode}`) : db.ref(`${order.storeCode}`)).child(WITHDRAW_PATH).child(`${order._id}`).update(parsedOrder)
        }
    }

    async addWithdrawOrder(order: IOrder): Promise<void> {
        if (order.orderType === OrderType.withdraw) {
            const parsedOrder = this.handlerOrder(order);
            const db = getDatabase();
            (isDevelopment ? db.ref(enviroment).child(`${order.storeCode}`) : db.ref(`${order.storeCode}`)).child(WITHDRAW_PATH).child(`${order._id}`).set(parsedOrder)
        }  
    }

    async addPreparationOrder(order: IOrder): Promise<void> {
        const parsedOrder = this.handlerOrder(order);
        const db = getDatabase();
        (isDevelopment ? db.ref(enviroment).child(`${order.storeCode}`) : db.ref(`${order.storeCode}`)).child(PREPARATION_PATH).child(`${order._id}`).set(parsedOrder)
    }

    async notifyMultipleUsers(messages: INotification[]): Promise<void> {
        try {
            const instance = messaging();
            await instance.sendEach(
                messages.map((e) => this.setNotification(e.token, e.title, e.body, e.data))
            )
        } catch (e) {
            ErrorAlerts.sendDefaultAlert(e)
        }
    }

    async findSpoolData(storeCode: string): Promise<Array<IPrinterSpool>> {
        const db = getDatabase();
        const ref = (isDevelopment ? db.ref(enviroment).child(storeCode) : db.ref(storeCode)).child(SPOOL_PATH);
    
        const snap = await ref.get();
        const values = snap.val();
        return values;
    }

    async removeSpoolData(storeCode: string, id: string): Promise<void> {
        const db = getDatabase();
        const ref = (isDevelopment ? db.ref(enviroment).child(storeCode) : db.ref(storeCode)).child(SPOOL_PATH);
        const snap = await ref.get();
        const values = snap.val();
        if (values) {
            const value = Object.entries(values).find((data) => (data[1] as IPrinterSpool).orderId === id)
            if (value?.length) {
                ref.child(value[0]).remove();
            }
        }
    }

    async pushSpoolData(spool: IPrinterSpool): Promise<IPrinterSpool> {
        
        const printers = await this.printerRepository.findAll(spool.storeCode?.toString(), spool.type);

        if (!printers?.length) {
            throw new NotFoundError("Fila de impressão não está habilitada");
        }

        spool.printers = printers.map((print) => {
            return {
                _id: print._id ?? "",
                address: print.address,
                name: print.name,
                storeCode: print.storeCode,
                spools: print.spools.map((e) => {
                    return {
                        type: e.type,
                        enabled: e.enabled
                    }
                }),
                deleted: print.deleted
            };
        })

        const db = getDatabase();
        var ref: Reference;

        const data = await this.spoolHandler.prepareData(spool);

        if (isDevelopment) {
            ref = db.ref(enviroment).child(`${data.storeCode}`)
        } else {
            ref = db.ref(`${data.storeCode}`)
        }
        ref.child(SPOOL_PATH).push(data, (error) => {
            if (error) throw error;
        })
        return data;
    }

    async notifyUsers(token: string, title?: string, body?: string, data?: {[key: string]: string}): Promise<void> {
        try {
            const instance = messaging();
            await instance.send(this.setNotification(token, title, body, data))
        } catch (e) {
            ErrorAlerts.sendDefaultAlert(e);
            return undefined;
        }
    }

    async uploadFile(data: { path?: string; data?: string; }): Promise<string> {
        const bucket = getStorage().bucket();
        const imageBuffer = Buffer.from(data.data, "base64");
        const uploadFIle = bucket.file(data.path);
        await uploadFIle.save(imageBuffer);
        return getDownloadURL(uploadFIle);
    }

    private setNotification(token: string, title?: string, body?: string, data?: {[key: string]: string}) : Message {
        return {
            token: token,
            data: data,
            notification: {
                title,
                body
            },
            android: {
                priority: "high",
            },
            apns: {
                payload: {
                    aps: {
                        contentAvailable: true,
                    },
                },
                headers: {
                    "apns-push-type": "background",
                    "apns-priority": "5", // Must be `5` when `contentAvailable` is set to true.
                    "apns-topic": "io.flutter.plugins.firebase.messaging", // bundle identifier
                },
            },
        }
    }

    private handlerOrder(order: IOrder) {
        const parsedOrder : Partial<IFirebaseOrder> = {
            pedidosId: order.pedidosId,
            _id: `${order._id}`,
            firebaseToken: `${order.firebaseToken ?? ""}`,
            orderType: order.orderType,
            storeCode: `${order.storeCode}`,
            status: order.status,
            createdAt: order.createdAt?.toISOString() ?? new Date().toISOString(),
            client: {
                name: order?.client?.name ?? "",
                phoneNumber: order?.client?.phoneNumber ?? "",
                email: order?.client?.email ?? "",
                cgc: order?.client?.cgc ?? "",
            },
            userCreate: {
                username: order?.userCreate?.username ?? "Sistema"
            },
            accountDetail: {
                description: order?.accountDetail?.description ?? ""
            },
            subTotal: order?.subTotal ?? 0,
            totalProduct: order?.totalProduct ?? 0,
            deliveryTax: order?.deliveryTax ?? 0.0,
            totalTip: order?.totalTip ?? 0.0,
            products: [
                ...order.products.map((e) => {
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
                        totalAddOnes: e.totalAddOnes ?? 0.0,
                        subTotal: e.subTotal ?? 0.0,
                        totalProduct: e.totalProduct ?? 0.0,
                        addOnes: e.addOnes?.map((a) => {
                            return {
                                addOneName: a.addOneName,
                                quantity: a.quantity,
                                name: a.name,
                                price: a.price,
                            }
                        }) ?? []
                    }
                })
            ]
        }
        return parsedOrder;
    }

    checkPreparationOrders = async (companyId: string, days: number): Promise<void> => {
        const db = getDatabase();
        
        const ref = (isDevelopment ? db.ref(enviroment).child(companyId) : db.ref(companyId)).child(PREPARATION_PATH);

        const getRef = await ref.get();

        const oldOrders = <string[]>[];

        getRef.forEach((e) => {
            const data = e.toJSON() as any;
            const orderCreation = new Date(data.createdAt);

            const now = new Date();

            const diffTime = Math.abs(now.getTime() - orderCreation.getTime());

            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > days) {
                oldOrders.push(e.key);
            }
        });

        if (oldOrders.length === 0) {
            return;
        }
        
        await Promise.all(oldOrders.map((e: string) => ref.child(e).remove()))

        this.sender.infoAlert(`Processamento de limpeza de ordens antigas finalizado`);

    }
}
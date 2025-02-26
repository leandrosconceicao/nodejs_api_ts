import { delay, inject, injectable, registry } from "tsyringe";
import ICloudService from "../../domain/interfaces/ICloudService";
import {getStorage, getDownloadURL} from "firebase-admin/storage";
import { getDatabase } from "firebase-admin/database";
import { messaging } from "firebase-admin";
import ErrorAlerts from "../errorAlerts";
import ISpoolHandler from "../../domain/interfaces/ISpoolHandler";
import { IPrinterSpool } from "../../models/PrinterSpool";

@injectable()
@registry([
    {
        token: "ICloudService",
        useToken: delay(() => CloudService)
    }
])
export default class CloudService implements ICloudService {

    constructor(
        @inject('ISpoolHandler') private readonly spoolHandler: ISpoolHandler
    ) {}


    async findSpoolData(storeCode: string): Promise<Array<IPrinterSpool>> {
        const db = getDatabase();
        const ref = db.ref(storeCode).child("spool");
    
        const snap = await ref.get();
        const values = snap.val();
        return values;
    }

    async removeSpoolData(storeCode: string, id: string): Promise<void> {
        const db = getDatabase();
        const ref = db.ref(storeCode).child("spool");
        const snap = await ref.get();
        const values = snap.val();
        const value = Object.entries(values).find((data) => (data[1] as IPrinterSpool).orderId === id)
        if (value[0]) {
            ref.child(value[0]).remove();
        }
    }

    async pushSpoolData(order: IPrinterSpool): Promise<IPrinterSpool> {
        const db = getDatabase();
        const data = await this.spoolHandler.prepareData(order)
        db.ref(`${data.storeCode}`).child('spool').push(data, (error) => {
            if (error) throw error;
        })
        return data;
    }

    async notifyUsers(token: string, title?: string, body?: string, data?: {[key: string]: string}): Promise<void> {
        try {
            const instance = messaging();
            await instance.send({
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
            })
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
}
import { delay, injectable, registry } from "tsyringe";
import ICloudService from "../../domain/interfaces/ICloudService";
import {getStorage, getDownloadURL} from "firebase-admin/storage";
import { messaging } from "firebase-admin";
import ErrorAlerts from "../errorAlerts";

@injectable()
@registry([
    {
        token: "ICloudService",
        useToken: delay(() => CloudService)
    }
])
export default class CloudService implements ICloudService {

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
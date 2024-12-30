import { messaging } from "firebase-admin";
import { NotificationMessagePayload } from "firebase-admin/lib/messaging/messaging-api";
import ErrorAlerts from "../errorAlerts";


export default class FirebaseMessaging {
    async sendToUser(
        token: string, 
        notification: NotificationMessagePayload,
        data?: {
            [key: string]: string;
        }
    ) : Promise<string> {
        try {
            const instance = messaging();
            return await instance.send({
                token: token,
                data: data,
                notification: notification,
                android: {
                    priority: "high",
                },
                // Add APNS (Apple) config
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
}
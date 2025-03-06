import { IOrder } from "../../models/Orders";
import { IPrinterSpool } from "../../models/PrinterSpool";

export interface INotification {
    token: string, 
    title?: string, 
    body?: string, 
    data?: {[key: string]: string}
}

export default interface ICloudService {
    
    uploadFile(data: {path?: string, data?: string}) : Promise<string>

    notifyUsers(token: string, title?: string, body?: string, data?: {
        [key: string]: string;
    }) : Promise<void>

    notifyMultipleUsers(messages: INotification[]) : Promise<void>

    pushSpoolData(order: IPrinterSpool) : Promise<IPrinterSpool>;

    removeSpoolData(storeCode: string, id: string) : Promise<void>;

    findSpoolData(storeCode: string) : Promise<Array<IPrinterSpool>>;

    addPreparationOrder(order: IOrder) : Promise<void>;

    updateWithdrawOrder(order: IOrder) : Promise<void>;

    addWithdrawOrder(order: IOrder) : Promise<void>;

    removePreparationOrder(order: IOrder) : Promise<void>;
}
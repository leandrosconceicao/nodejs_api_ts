import { IPrinterSpool } from "../../models/PrinterSpool";

export default interface ICloudService {
    
    uploadFile(data: {path?: string, data?: string}) : Promise<string>

    notifyUsers(token: string, title?: string, body?: string, data?: {
        [key: string]: string;
    }) : Promise<void>

    pushSpoolData(order: IPrinterSpool) : Promise<IPrinterSpool>;

    removeSpoolData(storeCode: string, id: string) : Promise<void>;

    findSpoolData(storeCode: string) : Promise<Array<IPrinterSpool>>;
}
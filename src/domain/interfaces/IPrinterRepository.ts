import { IPrinters } from "../types/IPrinters";
import { SpoolType } from "../types/IPrinterSpool";

export default interface IPrinterRepository {
    
    findAll(storeCode: string, type?: SpoolType) : Promise<IPrinters[]>
    findOne(id: string) : Promise<IPrinters>
    create(printer: IPrinters) : Promise<IPrinters>
    delete(id: string) : Promise<void>
    update(address: string, data: Partial<IPrinters>) : Promise<void>

}
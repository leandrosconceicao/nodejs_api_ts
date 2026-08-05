import { IPrinterSpool } from "../types/IPrinterSpool";


export default interface ISpoolHandler {
    prepareData(data: IPrinterSpool) : Promise<IPrinterSpool>;
    prepareReceiptData(spool: IPrinterSpool) : Promise<IPrinterSpool>;
    prepareOrderData(data: IPrinterSpool) : Promise<IPrinterSpool>;
    prepareCashRegisterData(data: IPrinterSpool) : Promise<IPrinterSpool>;
    prepareDeliveryData(data: IPrinterSpool) : Promise<IPrinterSpool>;
    removerAcentos(texto: string) : string
    formatNumber(value: number) : string
}
import { IPrinterSpool } from "../../models/PrinterSpool";
import ReceiptEnconder from "@mexicocss/esc-pos-encoder-ts";


export default interface ISpoolHandler {
    prepareData(data: IPrinterSpool) : Promise<IPrinterSpool>;
    prepareReceiptData(spool: IPrinterSpool) : Promise<IPrinterSpool>;
    prepareOrderData(data: IPrinterSpool) : Promise<IPrinterSpool>;
    prepareCashRegisterData(data: IPrinterSpool) : Promise<IPrinterSpool>;
    genText(encoder: ReceiptEnconder, text: string) : void;
    removerAcentos(texto: string) : string
    formatNumber(value: number) : string
}
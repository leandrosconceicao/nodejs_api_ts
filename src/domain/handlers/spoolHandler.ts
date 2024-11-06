import { IPrinterSpool, SpoolType } from "../../models/PrinterSpool";
import { IOrder, Orders } from "../../models/Orders";
import ReceiptEnconder, { PrinterWidthEnum } from "@mexicocss/esc-pos-encoder-ts";
import AccountsController from "../../controllers/accounts/accountsController";
import ISpoolHandler from "../interfaces/ISpoolHandler";

const populateClient = "client";
const popuAccId = "accountId";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";

export default class SpoolHandler implements ISpoolHandler {
    
    prepareData = (data: IPrinterSpool) => {
        if (data.accountId && data.type == SpoolType.account_receipt) {
            return this.prepareReceiptData(data)
        }
        return this.prepareOrderData(data);
    }
    
    prepareReceiptData = async (spool: IPrinterSpool) => {
        const data = await AccountsController.getReceipt(`${spool.accountId}`)
        const encoder = new ReceiptEnconder();
        
        encoder.setPinterType(PrinterWidthEnum._58);
        encoder.size(1);
        encoder.newline();
        
        this.genText(encoder, "EXTRATO");
    
        this.genText(encoder, `Conta: ${data.description}`)
    
        encoder.newline();
        encoder.newline();
        
        encoder.text("      ")
        encoder.text("Produto");
        encoder.text("          ")
        encoder.text("Valor");
        encoder.text("  ")
    
        encoder.newline();
        
        const subTotal = data.totalOrder;
    
        const totPay = data.totalPayment;
        
        data.orders.forEach((orders) => {
            orders.products.forEach((prod) => {
                encoder.text(`${prod.quantity}x ${this.removerAcentos(prod.productName)}   ${this.formatNumber(prod.quantity * prod.unitPrice)}`);
                encoder.emptyLine()
                // if (prod.addOnes.length) {
                    //     prod.addOnes.forEach((add) => {
                        //         encoder.text(`\n${add.name}`)
                        //     })
                        // }
                    })
                });
                
        data.payments.forEach((payments) => {
            encoder.text(`${payments.description} - ${this.formatNumber(payments.value)}`).align("center")
            encoder.emptyLine()
        })
    
        encoder.newline();
        encoder.newline().align("left");
    
        this.genText(encoder, `Valor do pedido: ${this.formatNumber(subTotal)}`)
        this.genText(encoder, `Total pago: ${this.formatNumber(totPay)}`)
        this.genText(encoder, `Restando: ${this.formatNumber(subTotal - totPay)}`)
    
        encoder.newline();
        encoder.newline();
    
        encoder.text(`Nome do cliente: ${data.client.name ?? ""}\n`);
        encoder.text(`Telefone: ${data.client.phoneNumber ?? ""}\n`);
    
        
        encoder.newline();
        encoder.newline();
        encoder.newline();
    
        spool.buffer = Buffer.from(encoder.encode()).toString("base64");
        return spool;
    }
    
    prepareOrderData = async (data: IPrinterSpool) => {
        const encoder = new ReceiptEnconder();
    
        encoder.setPinterType(PrinterWidthEnum._58);
        encoder.size(1);
        encoder.newline();
        
        const order = await Orders.findById(`${data.orderId}`)
            .populate(["payment", "payment.value.method"])
            .populate(populateClient)
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]).lean();
        
        const parsedOrder = order as unknown as IOrder;
    
        encoder.text(`Numero: ${parsedOrder.pedidosId}`)
        
        encoder.newline();
        
        if (data.reprint) {
            encoder.text("REIMPRESSAO")
            encoder.newline();
        }
        encoder.text(parsedOrder.createDate.toLocaleString())
    
        encoder.newline();
        encoder.newline();
        
        encoder.text("      ")
        encoder.text("Produto");
        encoder.text("          ")
        encoder.text("Valor");
        encoder.text("  ")
    
        encoder.newline();
    
        const subTotal = parsedOrder.products.reduce((ol, newV) => ol + (newV.quantity * newV.unitPrice), 0)
    
        const totPay = parsedOrder.payment?.value.value ?? 0.0;
        
        parsedOrder.products.forEach((prod) => {
            encoder.text(`${prod.quantity}x ${this.removerAcentos(prod.orderDescription)}   ${this.formatNumber(prod.quantity * prod.unitPrice)}`);
            if (prod.addOnes?.length)
                prod.addOnes.forEach((add) => {
                    encoder.text(`\n${add.name}`)
                })
        });
        encoder.newline();
        encoder.newline();
    
        this.genText(encoder, `Valor do pedido: ${this.formatNumber(subTotal)}`)
        this.genText(encoder, `Total pago: ${this.formatNumber(totPay)}`)
        this.genText(encoder, `Restando: ${this.formatNumber(subTotal - totPay)}`)
    
        encoder.newline();
        encoder.newline();
    
    
        this.genText(encoder, `Obs: ${this.removerAcentos(parsedOrder.observations ?? "")}`);
        this.genText(encoder, `Vendedor: ${parsedOrder.userCreate?.username ?? "Sistema"}`);
        encoder.text(`Nome do cliente: ${parsedOrder.client.name ?? ""}\n`);
        encoder.text(`Telefone: ${parsedOrder.client.phoneNumber ?? ""}\n`);
        encoder.text(`Endereco: ${parsedOrder.client.address ?? ""}\n`);
    
        if (parsedOrder.accountId)
            this.genText(encoder, `Conta: ${parsedOrder.accountId.description ?? ""}`)
    
        encoder.newline();
        encoder.newline();
        encoder.newline();
    
    
        data.buffer = Buffer.from(encoder.encode()).toString("base64");
        return data;
    }
    
    genText = (encoder: ReceiptEnconder, text: string) => {
        encoder.text(text);
        encoder.newline();
    }
    
    removerAcentos = (texto: string) => {
        const comAcentos = "ÄÅÁÂÀÃäáâàãÉÊËÈéêëèÍÎÏÌíîïìÖÓÔÒÕöóôòõÜÚÛüúûùÇç";
        const semAcentos = "AAAAAAaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUuuuuCc";
    
        for (let i = 0; i < comAcentos.length; i++) {
            texto =
                texto.replaceAll(comAcentos[i].toString(), semAcentos[i].toString());
        }
        return texto;
    }
    
    formatNumber = (value: number) => {
        const formCurrency = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currencyDisplay: "symbol",
            currency: 'BRL',
            minimumFractionDigits: 2
        });
        return formCurrency.format(value);
    }
}
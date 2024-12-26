import { IPrinterSpool, SpoolType } from "../../models/PrinterSpool";
import { IOrder, Orders } from "../../models/Orders";
import ReceiptEnconder, { PrinterWidthEnum } from "@mexicocss/esc-pos-encoder-ts";
import AccountsController from "../../controllers/accounts/accountsController";
import ISpoolHandler from "../interfaces/ISpoolHandler";
import { CashRegister, ICashRegister } from "../../models/CashRegister";
import NotFoundError from "../../models/errors/NotFound";
import PaymentController from "../../controllers/payments/paymentController";

const popuAccId = "accountDetail";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";

export default class SpoolHandler implements ISpoolHandler {

    prepareCashRegisterData = async (data: IPrinterSpool) => {
        const cash = await CashRegister.findById<ICashRegister>(data.cashRegisterId)
            .populate("userDetail", ["-establishments", "-pass"])
            .populate("suppliersAndWithdraws")
            .populate("cashRegisterCompare")
            .populate({
                path: "cashRegisterCompare",
                populate: {
                    path: "valuesByMethod.methodData",
                    model: "paymentMethods"
                }
            })
        if (!cash) {
            throw new NotFoundError("Usuário não possui caixa em aberto");
        }
        cash.paymentsByMethod = await PaymentController.getPayments({
            cashRegisterId: cash._id
        });

        const encoder = new ReceiptEnconder();
        
        encoder.setPinterType(PrinterWidthEnum._58);

        encoder.size(.5);

        encoder.newline();

        this.genText(encoder, "Registo de caixa");

        encoder.newline();
        encoder.newline();

        this.genText(encoder, `Aberto por: ${cash.userDetail?.username ?? ""}`);
        
        encoder.newline();

        this.genText(encoder, `Abertura: ${this.formatDate(cash.openAt)}`);

        encoder.newline();

        if (cash.closedAt) 
            this.genText(encoder, `Fechamento: ${this.formatDate(cash.closedAt)}`);

        encoder.newline();

        this.genText(encoder, `Saldo inicial: ${cash.openValue.toFixed(2)}`);

        const incomes = cash.suppliersAndWithdraws.filter((sw) => sw.type === "supply");

        const totalIncomes = incomes.reduce((ol, newV) => ol + newV.value, 0);
        
        const outcomes = cash.suppliersAndWithdraws.filter((sw) => sw.type === "withdraw");    

        const totalOutcomes = outcomes.reduce((ol, newV) => ol + newV.value, 0);

        const totalPayments = cash.paymentsByMethod.reduce((ol, newV) => ol + newV.total, 0);

        const totalReceived = totalPayments + totalIncomes;

        const operationTotal = totalReceived - totalOutcomes;

        this.genText(encoder, `Total Recebido: ${totalReceived.toFixed(2)}`);

        this.genText(encoder, `Total Saidas: ${(totalOutcomes).toFixed(2)}`);

        this.genText(encoder, `Saldo Final: ${operationTotal + cash.openValue}`);

        encoder.newline();
        encoder.newline();

        this.genText(encoder, "Rec. p/ forma de pagamento")

        cash.paymentsByMethod.forEach((payment) => {
            this.genText(encoder, `${this.removerAcentos(payment.description)}: ${payment.total.toFixed(2)}`)
        })

        encoder.newline();

        this.genText(encoder, `Entradas`);

        incomes.forEach((income) => {
            this.genText(encoder, `${this.removerAcentos(income.description)}: ${income.value.toFixed(2)}`)
        })

        encoder.newline();

        this.genText(encoder, `Saidas`);

        outcomes.forEach((outcome) => {
            this.genText(encoder, `${this.removerAcentos(outcome.description)}: ${outcome.value.toFixed(2)}`)
        })

        if (cash.status === "closed" && cash.cashRegisterCompare.length) {
            encoder.newline();
            this.genText(encoder, "Confronto de caixa");
            encoder.newline();

            const compare = cash.cashRegisterCompare[0];
            
            compare.valuesByMethod.forEach((method) => {
                const methodDetail = method.methodData;
                this.genText(encoder, `${this.removerAcentos(methodDetail.description)}: ${method.total.toFixed(2)}`)
            });

        }

        encoder.newline();
        encoder.newline();
        encoder.newline();



        data.buffer = Buffer.from(encoder.encode()).toString("base64");

        return data;
    }
    
    prepareData = (data: IPrinterSpool) => {
        switch (data.type) {
            case SpoolType.account_receipt:
                return this.prepareReceiptData(data)
            case SpoolType.order:
                return this.prepareOrderData(data)
            case SpoolType.cashRegister:
                return this.prepareCashRegisterData(data)
            default:
                throw new Error("Method not implemented.");
        }
    }
    
    prepareReceiptData = async (spool: IPrinterSpool) => {
        const data = await AccountsController.getReceipt(`${spool.accountId}`)
        const encoder = new ReceiptEnconder();
        
        encoder.setPinterType(PrinterWidthEnum._58);
        encoder.size(.5);
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
                encoder.text(`${prod.quantity}x ${this.removerAcentos(prod.productName)}   ${(prod.quantity * prod.unitPrice).toFixed(2)}`);
                encoder.emptyLine()
                // if (prod.addOnes.length) {
                    //     prod.addOnes.forEach((add) => {
                        //         encoder.text(`\n${add.name}`)
                        //     })
                        // }
                    })
                });
                
        encoder.newline();

        data.payments.forEach((payments) => {
            encoder.text(`${this.removerAcentos(payments.description)} - ${payments.total.toFixed(2)}`).align("center")
            encoder.emptyLine()
        })
    
        encoder.newline();
        encoder.newline().align("left");
    
        this.genText(encoder, `Valor do pedido: ${subTotal.toFixed(2)}`)
        this.genText(encoder, `Total pago: ${totPay.toFixed(2)}`)
        this.genText(encoder, `Restando: ${(subTotal - totPay).toFixed(2)}`)
    
        encoder.newline();
        encoder.newline();
    
        encoder.text(`Nome do cliente: ${this.removerAcentos(data?.client?.name ?? "")}\n`);
        encoder.text(`Telefone: ${data?.client?.phoneNumber ?? ""}\n`);
    
        
        encoder.newline();
        encoder.newline();
        encoder.newline();
    
        spool.buffer = Buffer.from(encoder.encode()).toString("base64");
        return spool;
    }
    
    prepareOrderData = async (data: IPrinterSpool) => {
        const encoder = new ReceiptEnconder();
    
        encoder.setPinterType(PrinterWidthEnum._58);
        encoder.newline();
        encoder.size(.5);
        
        const order = await Orders.findById(`${data.orderId}`)
            .populate("storeCodeDetail", ["-ownerId"])
            .populate("paymentMethodDetail")
            .populate("paymentDetail")
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]);
        
        const parsedOrder = order as IOrder;
    
        encoder.text(`Numero: ${parsedOrder.pedidosId}`)
        
        encoder.newline();
        
        if (data.reprint) {
            encoder.text("REIMPRESSAO").align("center");
            encoder.newline();
        }
        encoder.text(this.formatDate(parsedOrder.createdAt))
    
        encoder.newline();
        encoder.newline();
        encoder.align("left");
        
        encoder.text("      ")
        encoder.text("Produto");
        encoder.text("          ")
        encoder.text("Valor");
        encoder.text("  ")
    
        encoder.newline();
    
        const subTotal = parsedOrder.products.reduce((ol, newV) => ol + (newV.quantity * newV.unitPrice), 0)
    
        const totPay = parsedOrder.paymentDetail?.total ?? 0.0;
        
        parsedOrder.products.forEach((prod) => {
            encoder.text(`${prod.quantity}x ${this.removerAcentos(prod.orderDescription)}   ${(prod.quantity * prod.unitPrice).toFixed(2)}`).align("center");
            if (prod.addOnes?.length) {
                prod.addOnes.forEach((add) => {
                    encoder.text(`\n${this.removerAcentos(add.name)}`)
                })
                encoder.emptyLine();
            } else {
                encoder.emptyLine();
            }
            encoder.text(`Obs: ${this.removerAcentos(prod.observations)}`).align("center");
            encoder.emptyLine();
            encoder.emptyLine();
        });
        encoder.newline();
        encoder.newline().align("left");
    
        this.genText(encoder, `Valor do pedido: ${subTotal.toFixed(2)}`)
        this.genText(encoder, `Total pago: ${totPay.toFixed(2)}`)
        this.genText(encoder, `Restando: ${(subTotal - totPay).toFixed(2)}`)
    
        encoder.newline();
        encoder.newline();
    
    
        this.genText(encoder, `Vendedor: ${this.removerAcentos(parsedOrder.userCreate?.username ?? "Sistema")}`);
        encoder.text(`Nome do cliente: ${this.removerAcentos(parsedOrder?.client?.name ?? "")}\n`);
        encoder.text(`Telefone: ${parsedOrder?.client?.phoneNumber ?? ""}\n`);
        // encoder.text(`Endereco: ${this.removerAcentos(parsedOrder.client.address ?? "")}\n`);
    
        if (parsedOrder.accountDetail)
            this.genText(encoder, `Conta: ${this.removerAcentos(parsedOrder.accountDetail.description ?? "")}`)
    
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

    formatDate = (date: Date | string) => {
        if (typeof date === "string") {
            try {
                date = new Date(date);
            } catch (e) {
                date = new Date();
            }
        }
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}
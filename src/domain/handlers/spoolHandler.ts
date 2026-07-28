import { IPrinterSpool, SpoolType } from "../types/IPrinterSpool";
import { IOrder, Orders, OrderStatus } from "../../models/Orders";
import EscPosEncoder from "esc-pos-encoder";
import ISpoolHandler from "../interfaces/ISpoolHandler";
import { CashRegister, ICashRegister } from "../../models/CashRegister";
import NotFoundError from "../../models/errors/NotFound";
import PaymentController from "../../controllers/payments/paymentController";
import { delay, inject, injectable, registry } from "tsyringe";
import IAccountRepository from "../interfaces/IAccountRepository";
import { IReceiptOrdersProducts } from "../../models/Accounts";
import { DeliveryOrders } from "../../models/orders/delivery_orders";
import mongoose from "mongoose";

var ObjectId = mongoose.Types.ObjectId;

const popuAccId = "accountDetail";
const popuPayment = "-payments";
const popuOrders = "-orders";
const popuUser = "userCreate";
const popuEstablish = "-establishments";
const popuPass = "-pass";
interface ISpoolAddone {
    quantity: number, 
    name: string, 
    price?: number, 
    addOneName?: string
}

@injectable()
@registry([
    {
        token: `ISpoolHandler`,
        useToken: delay(() => SpoolHandler)
    }
])
export default class SpoolHandler implements ISpoolHandler {

    constructor(
        @inject('IAccountRepository') private readonly accountRepository : IAccountRepository,
    ) {}

    prepareDeliveryData = async (data: IPrinterSpool): Promise<IPrinterSpool> => {

        const encoder = new EscPosEncoder();

        const order = await DeliveryOrders.findOne({
            _id: new ObjectId(data.deliveryId?.toString()),
            storeCode: new ObjectId(data.storeCode?.toString())
        });

        if (!order) 
            throw new NotFoundError("Pedido não localizado");

        encoder.initialize();
        
         encoder
            .newline()
            .newline()
            .text('ENTREGA')
            .newline()
            .text('Comprovante de Saida')
            .newline();
        
            // Status
            const statusText =
            order.status === OrderStatus.pending
                ? 'PENDENTE'
                : order.status === OrderStatus.finished
                ? 'ENTREGUE'
                : 'EM ENTREGA';
        
            encoder.text(statusText).newline();
            encoder.line("----------------------------");
        
            // ═══════════════════════════════════════════════════════════
            // DADOS DO CLIENTE
            // ═══════════════════════════════════════════════════════════
            encoder.align('left').newline().text('CLIENTE').newline();
        
            encoder.text(this.removerAcentos(order.client.name ?? ""));
            
            // Telefone formatado
            const phone = order.client.phoneNumber;
            encoder.newline().text(`${phone}`).newline();
        
            encoder.line("----------------------------");
        
            // ═══════════════════════════════════════════════════════════
            // ENDEREÇO DE ENTREGA
            // ═══════════════════════════════════════════════════════════
            encoder.newline().text('ENDERECO ENTREGA').newline();
        
            // Caixa de destaque (linha dupla para simular)
            encoder.line("----------------------------");
            encoder
            .text(
                `${this.removerAcentos(order.client.address ?? "")}, ${order.client.number}`
            )
            .newline()
            .text(`${order.client.district}`)
            .newline()
            .text(`${order.client.city} - ${order.client.state}`)
            .newline()
            .text(`CEP: ${order.client.zipCode}`);
            encoder.newline().line("----------------------------");
        
            // ═══════════════════════════════════════════════════════════
            // PRODUTOS
            // ═══════════════════════════════════════════════════════════
            encoder.newline().text('ITENS DO PEDIDO').newline();
        
            for (const product of order.products) {
                this.prepareProducts(encoder, product.category ?? "", product.quantity, product.unitPrice, product.orderDescription);
                product.addOnes?.forEach((add) => {
                    this.prepareAddOnes(encoder, add);
                })
            }
        
            encoder.line("----------------------------");
        
            // ═══════════════════════════════════════════════════════════
            // VALORES
            // ═══════════════════════════════════════════════════════════
            encoder.text(`Produtos: ${this.formatNumber(order.totalProduct ?? 0)}`);
        
            encoder.newline();
            // Taxa de entrega em destaque
            encoder.text(`Entrega: ${this.formatNumber(order.deliveryTax ?? 0)}`);
            
            encoder.newline().line("----------------------------");
        
            // Total
            encoder.text(`TOTAL: ${this.formatNumber(order.subTotal ?? 0)}`);
            
            encoder.newline().line("----------------------------");
        
            // ═══════════════════════════════════════════════════════════
            // INSTRUÇÕES DO ENTREGADOR
            // ═══════════════════════════════════════════════════════════
            encoder.align('left');
            encoder.newline().text('INSTRUCOES:').newline();
            encoder.text('Conferir quantidade de itens').newline();
            encoder.text('Verificar temperatura/estado').newline();
            encoder.text('Obter comprovante assinado').newline();
            encoder.text('Fotografar entrega (obr.)').newline();
        
            encoder.newline().line("----------------------------");
        
            // ═══════════════════════════════════════════════════════════
            // RODAPÉ
            // ═══════════════════════════════════════════════════════════
            encoder.align('center');
            encoder.newline();
            encoder.text('Entrega Rapida & Segura').newline();
            encoder.text(
            `Data: ${this.formatDate(order.createdAt ?? new Date())}`
            );
        
            encoder.newline().newline();
        
            // Corte de papel (ESC m)
            encoder.raw([0x1b, 0x6d]);

        data.buffer = Buffer.from(encoder.encode()).toString("base64");

        return data;
    }

    prepareCashRegisterData = async (data: IPrinterSpool) => {
        const encoder = new EscPosEncoder();
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

        encoder.newline();

        encoder.line("Registo de caixa");

        encoder.newline();

        encoder.line(`Aberto por: ${cash.userDetail?.username ?? ""}`);
        encoder.line(`Abertura: ${this.formatDate(cash.openAt)}`);

        encoder.newline();

        if (cash.closedAt) 
            encoder.line(`Fechamento: ${this.formatDate(cash.closedAt)}`);

        encoder.newline();

        encoder.line(`Saldo inicial: ${this.formatNumber(cash.openValue ?? 0)}`);

        const incomes = cash.suppliersAndWithdraws.filter((sw) => sw.type === "supply");

        const totalIncomes = incomes.reduce((ol, newV) => ol + newV.value, 0);
        
        const outcomes = cash.suppliersAndWithdraws.filter((sw) => sw.type === "withdraw");    

        const totalOutcomes = outcomes.reduce((ol, newV) => ol + newV.value, 0);

        const totalPayments = cash.paymentsByMethod.reduce((ol, newV) => ol + newV.total, 0);

        const totalReceived = totalPayments + totalIncomes;

        const operationTotal = totalReceived - totalOutcomes;

        encoder.line(`Total Recebido: ${this.formatNumber(totalReceived)}`);

        encoder.line(`Total Saidas: ${this.formatNumber(totalOutcomes)}`);

        encoder.line(`Saldo Final: ${this.formatNumber(operationTotal + (cash.openValue ?? 0))}`);

        encoder.newline();
        encoder.newline();

        encoder.line("Rec. p/ forma de pagamento")

        cash.paymentsByMethod.forEach((payment) => {
            encoder.line(`${this.removerAcentos(payment.description)}: ${this.formatNumber(payment.total)}`)
        })

        encoder.newline();

        encoder.line(`Entradas`);

        incomes.forEach((income) => {
            encoder.line(`${this.removerAcentos(income.description)}: ${this.formatNumber(income.value)}`)
        })

        encoder.newline();

        encoder.line(`Saidas`);

        outcomes.forEach((outcome) => {
            encoder.line(`${this.removerAcentos(outcome.description)}: ${this.formatNumber(outcome.value)}`)
        })

        if (cash.status === "closed" && cash.cashRegisterCompare.length) {
            encoder.newline();
            encoder.line("Confronto de caixa");
            encoder.newline();

            const compare = cash.cashRegisterCompare[0];
            
            compare.valuesByMethod.forEach((method) => {
                const methodDetail = method.methodData;
                encoder.line(`${this.removerAcentos(methodDetail.description)}: ${this.formatNumber(method.total)}`)
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
            case SpoolType.delivery:
                return this.prepareDeliveryData(data);
            default:
                return Promise.resolve(data);
        }
    }
    
    prepareReceiptData = async (spool: IPrinterSpool) => {
        const data = await this.accountRepository.findOne(`${spool.accountId}`)
        const encoder = new EscPosEncoder();

        encoder.initialize();
        encoder.newline();
        
        encoder.line("EXTRATO");    
        encoder.line(`Conta: ${data.description}`)
    
        encoder.newline().align("left");
        
        const subTotal = data.totalOrder;
    
        const totPay = data.totalPayment;
        
        data.orders.forEach((orders) => {
            this.parseProductsAccount(encoder, orders.products);
        });
                
        encoder.newline();

        data.payments.forEach((payments) => {
            encoder.line(`${this.removerAcentos(payments.description ?? "")} - ${payments.total.toFixed(2)}`).align("center")            
        })
    
        encoder.newline();
        encoder.newline().align("left");
    
        encoder.line(`Valor do pedido: ${this.formatNumber(subTotal ?? 0)}`)
        encoder.line(`Tx. de servico: ${this.formatNumber(data.totalTip ?? 0.0)}`)
        encoder.line(`Total pago: ${this.formatNumber(totPay ?? 0)}`)
        encoder.line(`Restando: ${this.formatNumber((subTotal ?? 0) - (totPay ?? 0))}`)
    
        encoder.newline();
        encoder.newline();
    
        encoder.line(`Nome do cliente: ${this.removerAcentos(data?.client?.name ?? "")}\n`);    
        
        encoder.newline();
        encoder.newline();
        encoder.newline();
    
        spool.buffer = Buffer.from(encoder.encode()).toString("base64");
        return spool;
    }
    
    prepareOrderData = async (data: IPrinterSpool) => {        
    
        const order = await Orders.findById(`${data.orderId}`)
            .populate("storeCodeDetail", ["-ownerId"])
            .populate("paymentMethodDetail")
            .populate("paymentDetail")
            .populate(popuAccId, [popuPayment, popuOrders])
            .populate(popuUser, [popuEstablish, popuPass]);
        
        const parsedOrder = order as IOrder;

        data.buffer = this.genererateReceipt(parsedOrder);

        return data;
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
            second: '2-digit',
            timeZone: 'America/Sao_Paulo'
        });
    }
    parseProductsAccount = (encoder: EscPosEncoder, products: IReceiptOrdersProducts[]) => {
        products.forEach((prod) => {
            this.prepareProducts(encoder, prod.category, prod.quantity, prod.unitPrice, prod.productName);     
            if (prod.addOnes?.length) {
                encoder.line("----------------------------")
                prod.addOnes?.forEach((add) => {
                    this.prepareAddOnes(encoder, {
                        name: add.name,
                        quantity: add.quantity ?? 0.0,
                        price: add.price
                    });
                });
            }
            encoder
                .line("----------------------------");
            encoder
                .bold(true)
                .line(`Subtotal: ${this.formatNumber(prod.totalProduct ?? 0.0)}`)
                .newline()
                .bold(false)
        })
    }

    private prepareProducts(encoder: EscPosEncoder, category: string, quantity: number, unitPrice: number, description?: string) {
        const subtotal = quantity * unitPrice;
        
        encoder.line(this.removerAcentos(category ?? "")).bold(true)
        .line(this.removerAcentos(description ?? "")).bold(false)
        .table(
            [
                { width: 24, align: "left" },
                { width: 8, align: "right" }
            ],
            [
                [`${quantity}x ${this.formatNumber(unitPrice)}`, this.formatNumber(subtotal)]
            ]
        );
    }

    private prepareAddOnes(encoder: EscPosEncoder, add: ISpoolAddone) {
        add.price ??= 0.0;
        const showValue = add.price > 0
        if (showValue) {
            encoder.line(` + ${this.removerAcentos(add.name)} (${add.quantity}x)        ${this.formatNumber(add.price)}`);
        } else {
            encoder.line(` + ${this.removerAcentos(add.name)}`);
        }
    }

    private receiptDetail(encoder: EscPosEncoder, subtotal: number, txService: number, discount: number, total: number) {
        encoder.table(
            [
                { width: 24, align: "left" },
                { width: 8, align: "right" }
            ],
            [
                ["Subtotal", this.formatNumber(subtotal)]
            ]
        )

        .table(
            [
                { width: 24, align: "left" },
                { width: 8, align: "right" }
            ],
            [
                ["Tx. servico", this.formatNumber(txService)]
            ]
        )
        .table(
            [
                { width: 24, align: "left" },
                { width: 8, align: "right" }
            ],
            [
                ["Desc. aplicado", `- ${this.formatNumber(discount)}`]
            ]
        ).bold(true)

        .table(
            [
                { width: 24, align: "left" },
                { width: 8, align: "right" }
            ],
            [
                ["TOTAl", this.formatNumber(total)]
            ]
        ).bold(false)
    }

    genererateReceipt = (order: IOrder) : string => {
        const encoder = new EscPosEncoder();
        encoder
            .initialize()            

            // Cabeçalho
            .bold(true)

            .table(
                [
                    { width: 32, align: "center" },
                ],
                [
                    [`PEDIDO ${order.pedidosId}`]
                ]
            )
            
            .bold(false)
            .table(
                [
                    { width: 32, align: "center" },
                ],
                [
                    ["Recibo venda"]
                ]
            )
            
            .newline()
            
            .line("----------------------------")
            
            // Pedido
            .align("left")
            .line(`Cliente: ${order.client?.name}`);
            if (order.accountDetail) {
                encoder.line(`Conta: ${this.removerAcentos(order.accountDetail?.description ?? "")}`)
            }

            encoder.line(`Data: ${this.formatDate(order.createdAt ?? new Date())}`)
            .line(`Operador: ${order.userCreate?.username}`)

            .line("----------------------------")
            
            // Produto
            .bold(false)
            
            order.products.forEach((product) => {
                this.prepareProducts(encoder, product.category ?? "", product.quantity, product.unitPrice, product.orderDescription);
                encoder.line("----------------------------")
                product.addOnes?.forEach((add) => {
                    this.prepareAddOnes(encoder, add);
                })
                encoder.line("----------------------------")
                
                if (product.observations) encoder.line(`Obs.: ${product.observations}`)
                    
                encoder
                    .bold(true)
                    .line(`Subtotal: ${this.formatNumber(product.totalProduct ?? 0.0)}`)
                    .newline()
                    .bold(false)
            });

            encoder.align("left")
            .line("----------------------------")


            this.receiptDetail(encoder, order.totalProduct ?? 0.0, order.totalTip ?? 0.0, order.discount ?? 0.0, order.subTotal ?? 0.0)

            encoder.line("----------------------------")

            .newline()

            .line("Obrigado!")
            .line("Volte sempre")
            .newline()
            .qrcode(order._id?.toString() ?? "", 1)
            .newline()
            .cut();

        const result = encoder.encode();

        return Buffer.from(result).toString("base64");
    }

    private title(encoder: EscPosEncoder, info: string) {
        encoder.bold(true).table(
            [
                { width: 32, align: "center" },
            ],
            [
                [info]
            ]
        ).bold(false);
    }
}
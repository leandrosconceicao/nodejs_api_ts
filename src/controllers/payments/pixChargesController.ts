import axios, { AxiosResponse } from "axios";
import {Payments, paymentValidation} from "../../models/Payments";
import { Validators } from "../../utils/validators";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound";
import InvalidParameter from "../../models/errors/InvalidParameters";
import LogsController from "../logs/logsController";
import https from "https";
import fs from "fs";
import * as dotenv from "dotenv";
import PixPayments from "../../models/PixPayments";
import {EfiChargeCreation, EfiCharges, EfiPixRefund, EfiPixResponse, EfiWebhookResponse, QrCode} from "../../models/efi/charges";
import {Establishments} from "../../models/Establishments";
import { z } from "zod";
import { idValidation } from "../../utils/defaultValidations";

interface QuerySearch {
    _id?: string,
    appsName?: string,
    version?: string,
}

interface EfiOAuthReturn {
    access_token?: string,
    token_type?: string,
    expires_in?: number,
    scope?: string,
    expiration_date?: Date
}

interface EfiPaySend {
    calendario?: {
        expiracao?: number
    },
    valor: {
        original: string
    },
    chave: string,
    solicitacaoPagador?: string,
    devedor?: {
        cpf: string,
        nome: string
    },
}

dotenv.config();

const certificate = fs.readFileSync(process.env.CERTIFICATE_PATH);

const AGENT = new https.Agent({
    pfx: certificate,
    passphrase: "",
})

const logControl = new LogsController();

const URL = process.env.PAYMENT_API;

let token_data: EfiOAuthReturn;

export default class PixChargesController {

    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            const TOKEN_DATA = await getOAuth();
            if (!TOKEN_DATA) {
                return noTokenReturn(res);
            }
            const data = z.object({
                start: z.string().datetime({offset: true}),
                end: z.string().datetime({offset: true})
            }).parse(req.query);
            const request = await efiRequest<EfiCharges>({
                auth: TOKEN_DATA,
                method: "GET",
                url: `${URL}/v2/cob?inicio=${data.start}&fim=${data.end}`,
            });
            return ApiResponse.success(request.data).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async validatePaymentChargeCheck(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.txid;
            if (!id) {
                throw new NotFoundError("TxId não foi localizado");
            }
            const query = await PixPayments.findOne({
                txId: id
            })
            .populate("storeCode")
            .populate("userCreate", ["-establishments", "-pass"]);
            return ApiResponse.success(query).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async validatePaymentCharge(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.txid;
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();
            if (!id.trimEnd()) {
                res.write(`error: ${JSON.stringify(new NotFoundError("Dados não localizados"))}\n\n`)
                res.end();
                return;
            }
            console.log("Iniciando consulta");
            const register = await PixPayments.findOne({
                txId: id,
            });
            if (!register) {
                res.write(`error: ${JSON.stringify(new NotFoundError("Dados não localizados"))}\n\n`);
                res.end();
                return;
            }
            const process = PixPayments.watch([
                {
                    $match: {
                        "operationType": "update",
                        "fullDocument.txId": id,
                    }
                }
            ], {fullDocument: "updateLookup"});
            process.on("change", (value) => {
                const doc = value.fullDocument;
                res.write(`data: ${JSON.stringify(ApiResponse.success(doc))}\n\n`);
                res.end();
                return;
            });

            process.on("error", () => {
                res.write(`data: ${JSON.stringify(ApiResponse.serverError())}\n\n`);
                process.close();
                res.end();
            });
            process.on("close", () => {
                process.close();
                res.end();
            });
        } catch (e) {
            res.end();
        }
    }

    static async refundPixCharge(req: Request, res: Response, next: NextFunction) {
        try {
            const TOKEN_DATA = await getOAuth();
            if (!TOKEN_DATA) {
                return noTokenReturn(res);
            }
            const { e2eId, id, value }: {e2eId: string, id: string, value: number} = req.body;
            if (isNaN(value)) {
                throw new InvalidParameter(new Validators("value", value).validate());
            }
            const e2Val = new Validators("e2eId", e2eId, "string").validate();
            const idVal = new Validators("id", id, "string").validate();
            if (!e2Val.isValid) {
                throw new InvalidParameter(e2Val);
            }
            if (!idVal.isValid) {
                throw new InvalidParameter(idVal);
            }
            const request = await efiRequest<EfiPixRefund>({
                auth: TOKEN_DATA,
                method: "PUT",
                url: `${URL}/v2/pix/${e2eId}/devolucao/${id}`,
                data: JSON.stringify({
                    valor: `${value}`
                })
            });
            return ApiResponse.success(request.data).send(res);
        } catch (e) {
            next(e);
        }
    }
    static async createCharge(req: Request, res: Response, next: NextFunction) {
        try {
            const body = z.object({
                value: z.string().transform((val) => parseFloat(val)),
                info: z.string().optional(),
                expiration_date: z.number(),
                userCreate: idValidation,
                storeCode: idValidation,
                clientData: z.object({
                    cgc: z.string(),
                    name: z.string()
                }).optional(),
                payment: paymentValidation
            }).parse(req.body);

            const establishment = await Establishments.findById(body.storeCode, {pixKey: 1, _id: 0});
            if (!establishment.pixKey) {
                return ApiResponse.badRequest("Estabelecimento não possui chave pix cadastrada").send(res);
            }
            const TOKEN_DATA = await getOAuth();
            if (!TOKEN_DATA) {
                return noTokenReturn(res);
            }
            const paymentData: EfiPaySend = {
                calendario: {
                    expiracao: body.expiration_date ?? 3600
                },
                valor: {
                    original: body.value.toFixed(2)
                },
                chave: establishment.pixKey,
                solicitacaoPagador: body.info ?? "Cobrança dos serviços prestados"                
            };
            if (body.clientData) {
                if (body.clientData.cgc && body.clientData.name) {
                    paymentData.devedor = {
                        cpf: body.clientData.cgc,
                        nome: body.clientData.name
                    }
                }
            };
            const requisition = await efiRequest<EfiChargeCreation>({
                auth: TOKEN_DATA,
                method: "POST",
                url: `${URL}/v2/cob`,
                data: JSON.stringify(paymentData)
            });
            requisition.data.payment_data = await getQrCode(TOKEN_DATA, requisition.data.loc.id);
            await new PixPayments({
                storeCode: body.storeCode,
                userCreate: body.userCreate,
                txId: requisition.data.txid,
                paymentData: {
                    storeCode: body.storeCode,
                    userCreate: body.userCreate,
                    accountId: body.payment.accountId,
                    value: {
                        txId: requisition.data.txid,
                        form: "pix",
                        value: body.value,
                    }
                },
            }).save();
            return ApiResponse.success(requisition.data).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async cancelPixCharge(req: Request, res: Response, next: NextFunction) {
        try {
            const txId = z.string().min(1).parse(req.params.txId);
            const process = await PixChargesController.onCancelPix(txId);
            if (!process.modifiedCount) {
                return ApiResponse.badRequest("Nenhum dado atualizado, verifique os filtros").send(res);
            }
            return ApiResponse.success(process).send(res);
        } catch (e) {
            next(e);
        }
    }

    static async onCancelPix(txId: string | Array<string>) {
        if (typeof txId === "object") {
            if (!txId.length) {
                return;
            }
            return PixPayments.updateMany({
                $in: txId
            }, {
                $set: {
                    status: "cancelled"
                }
            })
        }
        return PixPayments.updateOne({
            txId,
        }, {
            $set: {
                status: "cancelled"
            }
        })
    }

    static async webhook(req: Request, res: Response) {
        try {
            const {hmac} = req.query;
            const hmacVal = new Validators("hmac", hmac, "string").validate();
            if (!hmacVal.isValid) {
                res.sendStatus(403);
                return;
            }
            if (hmac !== process.env.GESTOR_HMAC) {
                res.sendStatus(403);
                return;
            }
            const data = req.body as EfiWebhookResponse;
            console.log(data.pix);
            const pixReq = data.pix[0];
            paymentSave(req, pixReq);
            res.sendStatus(200);
        } catch (e) {
            logControl.saveReqLog(req, e);
            res.sendStatus(200);
        }
    }
}

async function paymentSave(req: Request, pix: EfiPixResponse) {
    try {
        const process = await PixPayments.findOneAndUpdate({
            txId: pix.txid
        }, {
            $set: {
                status: "finished",
                endToEndId: pix.endToEndId,
                updated_at: new Date(),
            }
        }).lean();
        const newPayment = new Payments({
            accountId: process.paymentData.accountId,
            storeCode: process.storeCode,
            userCreate: process.userCreate,
            total: process.paymentData.total,
        });
        await newPayment.save();
    } catch (e) {
        logControl.saveReqLog(req, e);
    }
}

async function getQrCode(token: EfiOAuthReturn, id: number) : Promise<QrCode> {
    try {
        const request = await efiRequest<QrCode>({
            auth: token,
            method: "GET",
            url: `${URL}/v2/loc/${id}/qrcode`,
        });
        return request.data;
    } catch (e) {
        return undefined;
    }
}

async function getOAuth() : Promise<EfiOAuthReturn> {
    try {
        const data_credentials = `${process.env.CLIENT_ID}:${process.env.CLIENT_SECRET}`;
        const auth = Buffer.from(data_credentials).toString("base64");

        const data = JSON.stringify({
            grant_type: "client_credentials",
        });
        const now = new Date();
        if (!token_data || now > token_data.expiration_date) {
            const req = await axios({
                method: "POST",
                url: `${URL}/oauth/token`,
                headers: {
                    Authorization: `Basic ${auth}`,
                    "Content-Type": "application/json",
                },
                data,
                httpsAgent: AGENT,
            });
            token_data = req.data;
            const expiration = new Date();
            expiration.setSeconds(3200);
            token_data.expiration_date = expiration;
        }
        return token_data;
    } catch (_) {
        return undefined;
    }
}

function setHeaders(token: EfiOAuthReturn) {
    return {
        Authorization: `Bearer ${token.access_token}`,
        "Content-Type": "application/json",
    };
}

async function efiRequest<T>(request : {
    auth: EfiOAuthReturn, method: string, url: string, data?: string
}) : Promise<AxiosResponse<T>> {
    const req = await axios({
        method: request.method,
        url: request.url,
        headers: setHeaders(request.auth),
        data: request.data,
        httpsAgent: AGENT
    })
    return req;
}

function noTokenReturn(res: Response) {
    return ApiResponse.badRequest("Não foi possível recuperar o token ").send(res);
}
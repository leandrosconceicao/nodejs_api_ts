import express from "express";
import { z } from "zod";

type ApiInfo<T> = {
    statusProcess: boolean;
    message: string;
    status: number;
    tecnical?: string;
    dados?: T;
}

export default class ApiResponse<T={}> extends Error {
    response: ApiInfo<T>;
    constructor(response: ApiInfo<T>) {
        super();
        this.response = response;
    }

    static success<T>(data?: T, statusCode?: number) : ApiResponse<T> {
        return new ApiResponse<T>({
            statusProcess: true,
            message: "Success",
            status: statusCode ?? 200,
            dados: data ?? null
        });
    }

    static serverError(tecnical?: string) : ApiResponse {
        return new ApiResponse({
            statusProcess: false,
            message: "O servidor não conseguiu processar a requisição, estaremos analisando o caso",
            tecnical: tecnical,
            status: 500
        });
    }

    static badRequest(message?: string) : ApiResponse {
        return new ApiResponse({
            statusProcess: false,
            message: message ?? "Requisição é inválida.",
            status: 400
        });
    }

    static invalidParameter(parameter?: z.ZodIssue[]) : ApiResponse {
        const message = parameter.map((err) => `Parametro (${err.path.length ? err.path : 'ID'}) é inválido, ${err.message}`).join(", ");
        return new ApiResponse({
            statusProcess: false,
            message: message,
            status: 406
        });
    }

    static unauthorized(message?: string) : ApiResponse {
        return new ApiResponse({
            statusProcess: false,
            message: message ?? `Token inválido, expirado ou não informado`,
            status: 401
        });
    }

    static notFound() : ApiResponse {
        return new ApiResponse({
            statusProcess: false,
            message: `Recurso não existe ou não foi localizado`,
            status: 404
        });
    }

    static forbidden(message?: string) : ApiResponse {
        return new ApiResponse({
            statusProcess: false,
            message: message ?? "Acesso não permitido",
            status: 403,
        })
    }

    send(res: express.Response) {
        res.status(this.response.status).json(this.response);
    }
    
}
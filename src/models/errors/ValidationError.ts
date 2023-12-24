import ApiResponse from "../base/ApiResponse";
import mongoose from "mongoose";

export default class ValidationError extends ApiResponse {
    constructor(erro: mongoose.Error.ValidationError) {
        const msg = Object.values(erro.errors).map(err => err.message).join("; ");
        super({
            statusProcess: false,
            message: `Os seguintes erros foram encontrados: ${msg}`,
            dados: null,
            tecnical: null,
            status: 400,
        });
    }
}
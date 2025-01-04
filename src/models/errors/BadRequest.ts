import ApiResponse from "../base/ApiResponse"

export default class BadRequestError extends ApiResponse {
    constructor(message: string) {
        super({
            statusProcess: false,
            message: message,
            dados: null,
            tecnical: null,
            status: 400,
        });
    }
}
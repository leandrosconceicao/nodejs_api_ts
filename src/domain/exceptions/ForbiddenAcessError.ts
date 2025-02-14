import ApiResponse from "../../models/base/ApiResponse";

export default class ForbiddenAcessError extends ApiResponse {

    constructor(message = "Usuário não possui permissão para realizar essa ação") {
        super({
            statusProcess: false,
            message: message,
            dados: null,
            tecnical: null,
            status: 403,
        });
    }

}
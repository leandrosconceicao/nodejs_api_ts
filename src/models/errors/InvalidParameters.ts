import ValidatorInfo from "../ValidationInfo";
import ApiResponse from "../base/ApiResponse";

export default class InvalidParameter extends ApiResponse {
    constructor(validation: ValidatorInfo) {
        super({
            statusProcess: false,
            message: `Parametro obrigatório (${validation.parameter}) é inválido ou não foi informado.${validation.info ?? ""}`,
            dados: null,
            tecnical: null,
            status: 406,
        });
    }
}
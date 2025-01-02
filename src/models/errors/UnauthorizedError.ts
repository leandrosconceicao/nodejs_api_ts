import ApiResponse from "../base/ApiResponse";

export default class UnauthorizedError extends ApiResponse {
  constructor(message = "Usuário não possui permissão para realizar essa ação") {
    super({
      statusProcess: false,
      message: message,
      dados: null,
      tecnical: null,
      status: 401,
    });
  }
}
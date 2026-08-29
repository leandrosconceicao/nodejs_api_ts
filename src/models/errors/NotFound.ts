import ApiResponse from "../base/ApiResponse";

export default class NotFoundError extends ApiResponse {
  constructor(message = "Página ou recurso não localizado, verifique os filtros de busca utilizados.") {
    super({
      statusProcess: false,
      message: message,
      status: 404,
    });
  }
}
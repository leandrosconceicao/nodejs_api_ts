import ApiResponse from "../base/ApiResponse";

class DuplicateError extends ApiResponse {
  constructor(error: any) {
    const info = Object.entries(error.keyValue)[0];
    super({
      statusProcess: false,
      message: `Não foi possível salvar, registro único violado, (${info[1]}) já está cadastrado.`,
      status: 400,
    });
  }
}

export default DuplicateError;

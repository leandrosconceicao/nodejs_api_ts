import ApiResponse from "../base/ApiResponse";
import {MongoServerError} from "mongodb";

class DuplicateError extends ApiResponse {
  constructor(error: MongoServerError) {
    const info = Object.entries(error.keyValue)[0];
    super({
      statusProcess: false,
      message: `Não foi possível salvar, registro único violado, este (${info[0]}) já está cadastrado.`,
      dados: null,
      tecnical: null,
      status: 400,
    });
  }
}

export default DuplicateError;

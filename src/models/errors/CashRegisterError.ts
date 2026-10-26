import ApiResponse from "../base/ApiResponse";

export default class CashRegisterError extends ApiResponse {
  constructor(message: string) {
    super({
      statusProcess: false,
      message: message,
      status: 400,
    });
  }
}
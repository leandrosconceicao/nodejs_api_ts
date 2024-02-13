interface EfiChargeCreation {
  calendario: Calendario;
  txid: string;
  revisao: number;
  loc: Loc;
  location: string;
  status: string;
  devedor: Devedor;
  valor: Valor;
  chave: string;
  solicitacaoPagador: string;
  pixCopiaECola: string;
  payment_data?: QrCode;
}
interface Valor {
  original: string;
}
interface Devedor {
  cnpj: string;
  nome: string;
}
interface Loc {
  id: number;
  location: string;
  tipoCob: string;
}
interface Calendario {
  criacao: string;
  expiracao: number;
}

interface QrCode {
  qrcode: string,
  imagemQrCode: string,
  linkView: string,
}

interface EfiWebhookResponse {
  pix: EfiPixResponse[];
}
interface EfiPixResponse {
  endToEndId: string;
  txid: string;
  chave: string;
  valor: string;
  horario: string;
  infoPagador: string;
}

interface EfiCharges {
  parametros: Parametros;
  cobs: EfiChargeCreation[];
}

interface Parametros {
  inicio: string;
  fim: string;
  paginacao: Paginacao;
}
interface Paginacao {
  paginaAtual: number;
  itensPorPagina: number;
  quantidadeDePaginas: number;
  quantidadeTotalDeItens: number;
}

interface EfiPixRefund {
  id: string;
  rtrId: string;
  valor: string;
  horario: Horario;
  status: string;
}
interface Horario {
  solicitacao: string;
}

export { EfiChargeCreation, QrCode, EfiWebhookResponse, EfiPixResponse, EfiCharges, EfiPixRefund};
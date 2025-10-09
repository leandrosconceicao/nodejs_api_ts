export interface IUtilities {
    generateQrCode(data: string) : Promise<Buffer>;
}
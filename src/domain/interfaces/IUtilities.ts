export interface IUtilities {
    generateQrCode(data: string, scale?: number) : Promise<Buffer>;
}
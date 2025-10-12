import { injectable, registry, delay } from "tsyringe";
import { IUtilities } from "../domain/interfaces/IUtilities";
import QRCode from 'qrcode'

@injectable()
@registry([
    {
        token: `IUtilities`,
        useToken: delay(() => Utilities)
    }
])
export class Utilities implements IUtilities {
    
    generateQrCode(data: string, scale?: number): Promise<Buffer> {
        return QRCode.toBuffer(data, {
            scale: scale
        });
    }
}
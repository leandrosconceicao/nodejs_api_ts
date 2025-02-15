import { delay, injectable, registry } from "tsyringe";
import ICloudService from "../../domain/interfaces/ICloudService";
import {getStorage, getDownloadURL} from "firebase-admin/storage";

@injectable()
@registry([
    {
        token: "ICloudService",
        useToken: delay(() => CloudService)
    }
])
export default class CloudService implements ICloudService {
    async uploadFile(data: { path?: string; data?: string; }): Promise<string> {
        const bucket = getStorage().bucket();
        const imageBuffer = Buffer.from(data.data, "base64");
        const uploadFIle = bucket.file(data.path);
        await uploadFIle.save(imageBuffer);
        return getDownloadURL(uploadFIle);
    }
}
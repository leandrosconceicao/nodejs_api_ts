import {getStorage, getDownloadURL} from "firebase-admin/storage";

class FirebaseStorage {

    async uploadFile(data: {
        path?: string,
        data?: string
    }) {
        const bucket = getStorage().bucket();
        const imageBuffer = Buffer.from(data.data, "base64");
        // await bucket.upload(data.filename ?? `logo_${id}`, );
        const uploadFIle = bucket.file(data.path);
        await uploadFIle.save(imageBuffer);
        return getDownloadURL(uploadFIle);
    }

}

export default FirebaseStorage;
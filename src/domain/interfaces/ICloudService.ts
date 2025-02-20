export default interface ICloudService {
    
    uploadFile(data: {path?: string, data?: string}) : Promise<string>

    notifyUsers(token: string, title?: string, body?: string, data?: {
        [key: string]: string;
    }) : Promise<void>

}
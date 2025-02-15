export default interface ICloudService {
    uploadFile(data: {
        path?: string,
        data?: string
    }) : Promise<string>
}
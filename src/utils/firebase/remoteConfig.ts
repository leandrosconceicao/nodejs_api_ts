import MongoId from "../../models/custom_types/mongoose_types";
import {getRemoteConfig} from "firebase-admin/remote-config";

export default async function updateRemoteConfig(storeCode: MongoId | string, parameter: string, value: string) {
    try {
        const remoteConfig = getRemoteConfig();
        let template = await remoteConfig.getTemplate();
        template.parameterGroups[`${storeCode}`]
            .parameters[parameter]
                .defaultValue = {
                value: value,
            }
        await remoteConfig.publishTemplate(template);
    } catch (e) {
        console.log(e);
    }
}
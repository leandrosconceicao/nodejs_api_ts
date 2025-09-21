import {Request} from "express";

export interface ISender {
    errorAlert(error: Error, req: Request) : Promise<void>;
    errorAlertGeneral(error: Error, info?: any) : Promise<void>;
    infoAlert(message: string) : Promise<void>;
}
import Logs from "../../models/Logs";
import { Request, Response, NextFunction } from "express";

class LogsController {

    async saveReqLog(req: Request, err: any, action?: any) {
        try {
            return await new Logs({
                route: req.url,
                method: req.method,
                request_headers: req.headers,
                request_body: req.body,
                error: err,
                action: action
            }).save()            
        } catch (_) {
            // console.log(e)
        }
    }
}

export default LogsController;
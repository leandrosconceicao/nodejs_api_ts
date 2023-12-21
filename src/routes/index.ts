import express from "express";
import ApiResponse from "../models/base/ApiResponse";

export default (app: express.Application) => {
    app.get("/", (req: express.Request, res: express.Response) => {
        ApiResponse.success().send(res);
    })

    app.use(
        express.json()
    )
}
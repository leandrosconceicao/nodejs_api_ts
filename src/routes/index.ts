import express, { NextFunction } from "express";
import ApiResponse from "../models/base/ApiResponse";
import userRoutes from "./userRoutes";
import establishmentsRoutes from "./establishmentsRoutes";

export default (app: express.Application) => {
    app.get("/", (_: express.Request, res: express.Response, next: NextFunction) => {
        try {
            ApiResponse.success().send(res); 
        } catch (e) {
            next(e);
        }
    })

    app.use(
        express.json(),
        userRoutes,
        establishmentsRoutes
    )
}
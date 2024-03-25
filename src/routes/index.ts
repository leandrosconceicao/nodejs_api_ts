import express, { NextFunction } from "express";
import ApiResponse from "../models/base/ApiResponse";
import userRoutes from "./userRoutes";
import productsRoutes from "./productsRoutes";
import categoryRoutes from "./categoryRoutes";
import establishmentsRoutes from "./establishmentsRoutes";
import appRoutes from "./appRoutes";
import paymentRoutes from "./paymentRoutes";
import ordersRoutes from "./ordersRoutes";
// import clientRoutes from "./clientRoutes";
import accountRoutes from "./accountRoutes";
import reportRoutes from "./reportRoutes";

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
        establishmentsRoutes,
        productsRoutes,
        categoryRoutes,
        appRoutes,
        paymentRoutes,
        ordersRoutes,
        // clientRoutes,
        accountRoutes,
        reportRoutes,
    )
}
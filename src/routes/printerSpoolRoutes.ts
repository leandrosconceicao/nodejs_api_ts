import express from "express";
import PrintSpoolController from "../controllers/print_spool/printSpoolController";
import Endpoints from "../models/Endpoints";
import SpoolHandler from "../domain/handlers/spoolHandler";
import { container } from "tsyringe";
import ISpoolHandler from "../domain/interfaces/ISpoolHandler";
import { PrinterSpoolMiddleware } from "../middlewares/printerSpoolMiddleware";

container.resolve<ISpoolHandler>(SpoolHandler);
const spoolController = container.resolve(PrintSpoolController);
const spoolMiddleware = container.resolve(PrinterSpoolMiddleware);

export default express.Router()
    .get(`${Endpoints.printerSpool}/:storeCode`, spoolController.get, spoolMiddleware.fetchSpool)
    .post(`${Endpoints.printerSpool}`, spoolController.add, spoolMiddleware.spoolManagement)
    .delete(`${Endpoints.printerSpool}/:storeCode/:id`, spoolController.delete);
import express from "express";
import PrintSpoolController from "../controllers/print_spool/printSpoolController";
import Endpoints from "../models/Endpoints";
import { container } from "tsyringe";
import { PrinterSpoolMiddleware } from "../middlewares/printerSpoolMiddleware";

const spoolController = container.resolve(PrintSpoolController);
const spoolMiddleware = container.resolve(PrinterSpoolMiddleware);

export default express.Router()
    .get(`${Endpoints.printerSpool}/:storeCode`, spoolController.get, spoolMiddleware.fetchSpool)
    .post(`${Endpoints.printerSpool}`, spoolController.add, spoolMiddleware.spoolManagement)
    .delete(`${Endpoints.printerSpool}/:storeCode/:id`, spoolController.delete);
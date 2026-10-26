import express from "express";
import PrintSpoolController from "../controllers/print_spool/printSpoolController";
import Endpoints from "../models/Endpoints";
import { container } from "tsyringe";
import { PrinterSpoolMiddleware } from "../middlewares/printerSpoolMiddleware";
import tokenController from "../middlewares/tokenController";

const spoolController = container.resolve(PrintSpoolController);
const spoolMiddleware = container.resolve(PrinterSpoolMiddleware);

export default express.Router()
    .get(`${Endpoints.printerSpool}/:storeCode`, tokenController, spoolController.get, spoolMiddleware.fetchSpool)
    .post(`${Endpoints.printerSpool}`, tokenController, spoolController.add, spoolMiddleware.spoolManagement)
    .delete(`${Endpoints.printerSpool}/:storeCode/:id`, tokenController, spoolController.delete);
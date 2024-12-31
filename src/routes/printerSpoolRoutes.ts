import express from "express";
import PrintSpoolController from "../controllers/print_spool/printSpoolController";
import Endpoints from "../models/Endpoints";
import SpoolHandler from "../domain/handlers/spoolHandler";
import { fetchSpool, spoolManagement } from "../middlewares/printerSpoolMiddleware";

const spoolController = new PrintSpoolController(new SpoolHandler())

export default express.Router()
    .get(`${Endpoints.printerSpool}/:storeCode`, spoolController.get, fetchSpool)
    .post(`${Endpoints.printerSpool}`, spoolController.add, spoolManagement)
    .delete(`${Endpoints.printerSpool}/:id`, spoolController.delete);
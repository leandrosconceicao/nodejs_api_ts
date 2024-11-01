import express from "express";
import PrintSpoolController from "../controllers/print_spool/printSpoolController";
import Endpoints from "../models/Endpoints";
import SpoolHandler from "../domain/handlers/spoolHandler";

const spoolController = new PrintSpoolController(new SpoolHandler())

export default express.Router()
    .get(`${Endpoints.printerSpool}/:storeCode`, spoolController.get)
    .post(`${Endpoints.printerSpool}`, spoolController.add)
    .delete(`${Endpoints.printerSpool}/:id`, spoolController.delete);
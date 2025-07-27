import IPrinterRepository from "../domain/interfaces/IPrinterRepository";
import Endpoints from "../models/Endpoints";
import { container } from "tsyringe";
import MongoPrinterRepository from "../repository/mongoPrinterRepository";
import PrintersController from "../controllers/printers/printersController";
import { Router } from "express";
import tokenController  from "../middlewares/tokenController";

container.resolve<IPrinterRepository>(MongoPrinterRepository);

const printController = container.resolve(PrintersController);

export default Router()
    .get(`${Endpoints.printers}/:storeCode/search`, tokenController, printController.findAll)
    .get(`${Endpoints.printers}/:id`, tokenController, printController.findOne)
    .post(Endpoints.printers, tokenController, printController.create)
    .delete(`${Endpoints.printers}/:id`, tokenController, printController.delete)
    .put(`${Endpoints.printers}/:mac`, printController.update)
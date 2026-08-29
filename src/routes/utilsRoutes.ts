import express from "express";
import {container} from "tsyringe";
import { UtilsController } from "../controllers/utils/utilsController";
import Endpoints from "../models/Endpoints";
import tokenController from "../middlewares/tokenController";

const utilController = container.resolve(UtilsController);

export default express.Router()
    .post(`${Endpoints.utils}/qrcode`, tokenController, utilController.generateQrcode)

    
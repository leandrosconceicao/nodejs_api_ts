import express from "express";
import {container} from "tsyringe";
import { UtilsController } from "../controllers/utils/utilsController";
import Endpoints from "../models/Endpoints";

const utilController = container.resolve(UtilsController);

export default express.Router()
    .post(`${Endpoints.utils}/qrcode`, utilController.generateQrcode)

    
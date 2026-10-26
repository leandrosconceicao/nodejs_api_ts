import { Router } from "express";
import Endpoints from "../models/Endpoints";
import multer from "multer";
import { container } from "tsyringe";
import ProductImageController from "../controllers/products/images/productImageController";
import tokenController from "../middlewares/tokenController";

const upload = multer()

const productImageCtrl = container.resolve(ProductImageController);

export default Router()
    .post(`${Endpoints.product_images}/:storeCode/:productId`, tokenController, upload.single("file"), productImageCtrl.add )
    .delete(`${Endpoints.product_images}/:storeCode/:productId`, tokenController, productImageCtrl.remove )
    .patch(`${Endpoints.product_images}/:storeCode/:productId`, tokenController, productImageCtrl.patch )
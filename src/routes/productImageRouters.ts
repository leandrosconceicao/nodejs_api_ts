import { Router } from "express";
import Endpoints from "../models/Endpoints";
import multer from "multer";
import { container } from "tsyringe";
import ProductImageController from "../controllers/products/images/productImageController";

const upload = multer()

const productImageCtrl = container.resolve(ProductImageController);

export default Router()
    .post(`${Endpoints.product_images}/:storeCode/:productId`, upload.single("file"), productImageCtrl.add )
    .delete(`${Endpoints.product_images}/:storeCode/:productId`, productImageCtrl.remove )
    .patch(`${Endpoints.product_images}/:storeCode/:productId`, productImageCtrl.patch )
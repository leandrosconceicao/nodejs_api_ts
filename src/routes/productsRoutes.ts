import express from "express";
import ProductController from "../controllers/products/productController";
import AddOneController from "../controllers/products/addOnesController";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import MenuItemsController from "../controllers/products/menuItemsController";
import { container } from "tsyringe";

const menuController = container.resolve(MenuItemsController);
const addoneController = container.resolve(AddOneController);
const productController = container.resolve(ProductController);

export default express.Router()
    .get(`${Endpoints.menu_items}/v2/:storeCode`, menuController.getV2)
    .get(`${Endpoints.menu_items}/:storeCode`, menuController.get)
    .get(Endpoints.add_ones, validateToken, addoneController.findAll)
    .post(Endpoints.add_ones, validateToken, addoneController.add)
    .put(`${Endpoints.add_ones}/:id`, validateToken, addoneController.update)
    .patch(`${Endpoints.add_ones}/:id`, validateToken, addoneController.patch)
    .delete(`${Endpoints.add_ones}/:id`, validateToken, addoneController.delete)
    .get(Endpoints.products, productController.findAll, paginationAndFilters)
    .get(`${Endpoints.products}/:id`, productController.findOne)
    .post(Endpoints.products, validateToken, productController.addProduct)
    .put(`${Endpoints.products}/:id`, validateToken, productController.update)
    .delete(`${Endpoints.products}/:storeCode/:id`, validateToken, productController.deleteProduct)
    .patch(`${Endpoints.products}/batch`, validateToken, productController.updateBatch)
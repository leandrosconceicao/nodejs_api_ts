import express from "express";
import ProductController from "../controllers/products/productController";
import AddOneController from "../controllers/products/addOnesController";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import MenuItemsController from "../controllers/products/menuItemsController";

export default express.Router()
    .get(Endpoints.menu_items, MenuItemsController.get)
    .get(Endpoints.add_ones, validateToken, AddOneController.findAll)
    .post(Endpoints.add_ones, validateToken, AddOneController.add)
    .put(`${Endpoints.add_ones}/:id`, validateToken, AddOneController.update)
    .patch(`${Endpoints.add_ones}/:id`, validateToken, AddOneController.patch)
    .delete(`${Endpoints.add_ones}/:id`, validateToken, AddOneController.delete)
    .get(Endpoints.products, ProductController.findAll, paginationAndFilters)
    .get(`${Endpoints.products}/:id`, ProductController.findOne)
    .post(Endpoints.products, validateToken, ProductController.addProduct)
    .put(`${Endpoints.products}/:id`, validateToken, ProductController.update)
    .delete(`${Endpoints.products}/:id`, validateToken, ProductController.deleteProduct)
    .delete(Endpoints.product_images, validateToken, ProductController.deleteImage)
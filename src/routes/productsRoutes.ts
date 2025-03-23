import 'reflect-metadata';
import express from "express";
import ProductController from "../controllers/products/productController";
import AddOneController from "../controllers/products/addOnesController";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import MenuItemsController from "../controllers/products/menuItemsController";
import { container } from "tsyringe";
import { IProductRepository } from "../domain/interfaces/IProductRepository";
import { MongoProductRepository } from "../repository/mongoProductRepository";
import ICategoryRepository from "../domain/interfaces/ICategoryRepository";
import MongoCategoryRepository from "../repository/mongoCategoryRepository";
import ICloudService from "../domain/interfaces/ICloudService";
import CloudService from "../utils/cloud/cloudService";
import ISpoolHandler from "../domain/interfaces/ISpoolHandler";
import SpoolHandler from "../domain/handlers/spoolHandler";
import IAccountRepository from "../domain/interfaces/IAccountRepository";
import MongoAccountRepository from "../repository/mongoAccountRepository";
import IOrderRepository from "../domain/interfaces/IOrderRepository";
import MongoOrderRepository from "../repository/mongoOrderRepository";
import IEstablishmentRepository from '../domain/interfaces/IEstablishmentRepository';
import MongoEstablishmentRespository from '../repository/mongoEstablishmentRepository';
import { IAddonesRepository } from '../domain/interfaces/IAddonesRepository';
import { MongoAddonesRepository } from '../repository/mongoAddoneRepository';

container.resolve<IEstablishmentRepository>(MongoEstablishmentRespository);
container.resolve<IOrderRepository>(MongoOrderRepository);
container.resolve<IAccountRepository>(MongoAccountRepository);
container.resolve<ISpoolHandler>(SpoolHandler);
container.resolve<ICloudService>(CloudService);
container.resolve<IAddonesRepository>(MongoAddonesRepository);
container.resolve<ICategoryRepository>(MongoCategoryRepository);
container.resolve<IProductRepository>(MongoProductRepository);
const menuController = container.resolve(MenuItemsController);
const addoneController = container.resolve(AddOneController);
const productController = container.resolve(ProductController);

export default express.Router()
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
    .delete(`${Endpoints.products}/:id`, validateToken, productController.deleteProduct)
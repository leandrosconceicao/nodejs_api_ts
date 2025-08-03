import "reflect-metadata";
import { container } from 'tsyringe';
import express from "express";
import Endpoints from "../models/Endpoints";
import CategoryController from "../controllers/products/categoriesController";
import paginationAndFilters from "../middlewares/paginationAndFilters";
import validateToken from "../middlewares/tokenController";
import ICategoryRepository from "../domain/interfaces/ICategoryRepository";
import MongoCategoryRepository from "../repository/mongoCategoryRepository";
import CloudService from "../utils/cloud/cloudService";
import ICloudService from '../domain/interfaces/ICloudService';
import ISpoolHandler from "../domain/interfaces/ISpoolHandler";
import SpoolHandler from "../domain/handlers/spoolHandler";
import IAccountRepository from "../domain/interfaces/IAccountRepository";
import MongoAccountRepository from "../repository/mongoAccountRepository";
import IOrderRepository from "../domain/interfaces/IOrderRepository";
import MongoOrderRepository from "../repository/mongoOrderRepository";
import IEstablishmentRepository from "../domain/interfaces/IEstablishmentRepository";
import MongoEstablishmentRespository from "../repository/mongoEstablishmentRepository";
import IPrinterRepository from "../domain/interfaces/IPrinterRepository";
import MongoPrinterRepository from "../repository/mongoPrinterRepository";

container.resolve<IEstablishmentRepository>(MongoEstablishmentRespository);
container.resolve<IAccountRepository>(MongoAccountRepository);
container.resolve<IOrderRepository>(MongoOrderRepository);
container.resolve<ISpoolHandler>(SpoolHandler);
container.resolve<IPrinterRepository>(MongoPrinterRepository);
container.resolve<ICloudService>(CloudService);
container.resolve<ICategoryRepository>(MongoCategoryRepository);
const categoryController = container.resolve(CategoryController);

export default express.Router()
    .get(Endpoints.categories, validateToken, categoryController.findAll, paginationAndFilters)
    .get(`${Endpoints.categories}/:id`, validateToken, categoryController.findOne)
    .post(Endpoints.categories, validateToken, categoryController.add)
    .put(`${Endpoints.categories}/:id`, validateToken, categoryController.update)
    .patch(`${Endpoints.categories}/:storeCode`, validateToken, categoryController.updateOrdenation)
    .delete(`${Endpoints.categories}/:id`, validateToken, categoryController.delete)
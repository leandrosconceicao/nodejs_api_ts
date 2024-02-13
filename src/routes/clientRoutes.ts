import express from "express";
import ClientsController from "../controllers/clients/clientsController";
import Endpoints from "../models/Endpoints";
import validateToken from "../middlewares/tokenController";
import paginationAndFilters from "../middlewares/paginationAndFilters";

export default express.Router()
    .get(Endpoints.clients, ClientsController.findAll, paginationAndFilters)
import express from "express";
import Endpoints from "../models/Endpoints.js";
// import paginationAndFilters from "src/middlewares/paginationAndFilters.js";

export default express.Router()
    .get(Endpoints.accounts, (req, res, next) => {})
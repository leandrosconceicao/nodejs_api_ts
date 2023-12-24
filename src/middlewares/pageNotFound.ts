import express, { NextFunction } from "express";
import NotFoundError from "../models/errors/NotFound";

export default function(req: express.Request, res: express.Response, next: NextFunction) {
    const error = new NotFoundError();
    next(error);
}
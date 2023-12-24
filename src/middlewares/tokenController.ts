import TokenGenerator from "../utils/tokenGenerator";
import express, { NextFunction } from "express";

export default (req: express.Request, res: express.Response, next: NextFunction) => {
    try {
        TokenGenerator.verify(req.headers.authorization);
        next();
    } catch (e) {
        next(e);
    }
}
import mongoose from "mongoose"
import {MongoServerError} from "mongodb";
import express, { NextFunction } from "express";
import ApiResponse from "../models/base/ApiResponse";
import Jwt from "jsonwebtoken";
import ValidationError from "../models/errors/ValidationError";
import InvalidParameter from "../models/errors/InvalidParameters";
import NotFoundError from "../models/errors/NotFound";
import DuplicateError from "../models/errors/DuplicateError";
import { AxiosError } from "axios";
import {z} from "zod";
import ErrorAlerts from "../utils/errorAlerts";

export default function(err: Error, req: express.Request, res: express.Response, next: NextFunction) {
    
    if (err instanceof z.ZodError) {
        return ApiResponse.invalidParameter(err.errors).send(res);
    }
    if (err instanceof MongoServerError) {
        if (err.code === 11000) {
            return new DuplicateError(err).send(res);
        }
    }
    if (err instanceof mongoose.Error.CastError) {
        return ApiResponse.badRequest(err.message).send(res);
    }
    if (err instanceof mongoose.Error.ValidationError) {
        return new ValidationError(err).send(res);
    }
    if (err instanceof Jwt.JsonWebTokenError) {
        return ApiResponse.unauthorized().send(res);
    }
    if (err instanceof InvalidParameter) {
        return err.send(res);
    }
    if (err instanceof NotFoundError) {
        return err.send(res);
    }
    if (err instanceof AxiosError) {
        if (err.response.status < 499) {
            return ApiResponse.badRequest(err.response.data.mensagem).send(res);
        }
        return ApiResponse.serverError(err.response.data.mensagem).send(res);
    }
    if (err instanceof ApiResponse) {
        return err.send(res);
    }
    if (err instanceof SyntaxError && 'body' in err) {
        console.warn('JSON INVÁLIDO', {ip: req.ip, ua: req.get('User-Agent')});
        return ApiResponse.badRequest("JSON Inválido").send(res);
    }
    ErrorAlerts.sendAlert(err, req);
    return ApiResponse.serverError().send(res);
    
}
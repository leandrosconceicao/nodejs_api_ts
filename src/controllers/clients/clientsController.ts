import Clients from "../../models/Clients";
import { isValidObjectId } from "mongoose";
import { Validators } from "../../utils/validators";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound.js";
import InvalidParameter from "../../models/errors/InvalidParameters.js";

// interface QuerySearch {
//     _id?: string,
//     appsName?: string,
//     version?: string,
// }

export default class ClientsController {
    
    static async findAll(req: Request, res: Response, next: NextFunction) {
        try {
            req.result = Clients.find({});
            next();
        } catch (e) {
            next(e);
        }
    }

    static async findOne(req: Request, res: Response, next: NextFunction) {
        try {
            
        } catch (e) {
            next(e);
        }
    }

    static async add(req: Request, res: Response, next: NextFunction) {
        try {
            
        } catch (e) {
            next(e);
        }
    }

    static async update(req: Request, res: Response, next: NextFunction) {
        try {
            
        } catch (e) {
            next(e);
        }
    }

    static async delete(req: Request, res: Response, next: NextFunction) {
        try {
            
        } catch (e) {   
            next(e);
        }
    }
}
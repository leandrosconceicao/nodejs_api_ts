import mongoose from "mongoose";
import { isValidObjectId } from "mongoose";
import { PeriodQuery, DateQuery } from "../../utils/PeriodQuery.js";
import { Validators } from "../../utils/validators";
import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import NotFoundError from "../../models/errors/NotFound.js";
import InvalidParameter from "../../models/errors/InvalidParameters.js";

var ObjectId = mongoose.Types.ObjectId;

interface ReportQuery {
    storeCode: any,
    createDate: DateQuery,
    userCreate?: any,
    orderType?: string,
    product?: any,
    saller?: any,
}

export default class ReportsController {

    static async quantifySales(req: Request, res: Response, next: NextFunction) {
        try {
            const {storeCode, from, to, saller, type, product} = req.query;
            const storeVal = new Validators("storeCode", storeCode).validate();
            const fromVal = new Validators("from", from).validate();
            const toVal = new Validators("to", to).validate();
            if (!storeVal.isValid) {
                throw new InvalidParameter(storeVal);
            }
            if (!fromVal.isValid) {
                throw new InvalidParameter(fromVal);
            }
            if (!toVal.isValid) {
                throw new InvalidParameter(toVal);
            }
            const query: ReportQuery = {
                storeCode: new ObjectId(storeCode as string),
                createDate: new PeriodQuery(from as string, to as string).build()
            };
            if (saller !== undefined) {
                query.saller = saller;
            }
            if (type !== undefined) {
                query.orderType = type as string;
            }
            
        } catch (e) {
            next(e);
        }
    }

    // static async findOne(req: Request, res: Response, next: NextFunction) {
    //     try {

    //     } catch (e) {
    //         next(e);
    //     }
    // }
}
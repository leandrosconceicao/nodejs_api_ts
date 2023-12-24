import { NextFunction, Request, Response } from "express";
import Headers from "../models/Headers";
import ApiResponse from "../models/base/ApiResponse";

export default async function paginationAndFilters(req: Request, res: Response, next: NextFunction) {
    try {
        const headers = new Headers({
            limit: req.headers.limit,
            offset: req.headers.offset,
            ordenation: req.headers.ordenation,
            orderby: req.headers.orderby,
        });
        const paginationConfig = headers.getPagination();
        const ordenationConfig = headers.getOrderBy();
        const sort = ordenationConfig.orderBy ? {[ordenationConfig.orderBy]: ordenationConfig.ordenation} : {};
        const request = req.result;
        const parsedData = await request.find()
            .sort(sort)
            .skip(paginationConfig.offset)
            .limit(paginationConfig.limit)
        ApiResponse.success(parsedData).send(res);
    } catch (e) {
        next(e);
    }
}
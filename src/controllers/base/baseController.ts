import { Request, Response, NextFunction } from "express";

export default interface BaseController {

    onNewData(req: Request, res: Response, next: NextFunction) : Promise<void>

    onFindAll(req: Request, res: Response, next: NextFunction) : Promise<void>

    onFindOne(req: Request, res: Response, next: NextFunction) : Promise<void>

    onDeleteData(req: Request, res: Response, next: NextFunction) : Promise<void>

    onUpdateData(req: Request, res: Response, next: NextFunction) : Promise<void>

}
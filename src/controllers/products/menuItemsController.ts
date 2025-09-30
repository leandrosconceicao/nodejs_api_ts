import { Request, Response, NextFunction } from "express";
import ApiResponse from "../../models/base/ApiResponse";
import { autoInjectable, inject } from "tsyringe";
import ICategoryRepository from "../../domain/interfaces/ICategoryRepository";
import { idValidation } from "../../utils/defaultValidations";
import IEstablishmentRepository from "../../domain/interfaces/IEstablishmentRepository";
import { IEstablishmentMenuItems } from "../../domain/interfaces/IEstablishmentMenuItems";
@autoInjectable()
export default class MenuItemsController {

    constructor(
        @inject("ICategoryRepository") private readonly categoryRepository : ICategoryRepository,
        @inject("IEstablishmentRepository") private readonly establishmentRepository: IEstablishmentRepository
    ) {}

    get = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const storeCode = idValidation.parse(req.params.storeCode);

            const data = await this.categoryRepository.getMenuItems(storeCode);
            
            return ApiResponse.success(data).send(res);
        } catch (e) {
            next(e);
        }
    }
    
    getV2 = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const id = idValidation.parse(req.params.storeCode);

            const store = await this.establishmentRepository.findOne(id);
        
            const categories = await this.categoryRepository.getMenuItems(id);

            const data: IEstablishmentMenuItems = {
                company: store,
                categories: categories
            };

            return ApiResponse.success(data).send(res);

        } catch (e) {
            next(e);
        }
    }
}
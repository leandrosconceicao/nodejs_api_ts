import { ICategory } from "../../models/Categories";
import { EstablishmentResponseDto } from "../../domain/dtos/establishment/establishment_dto";

export interface IEstablishmentMenuItems {
    company: EstablishmentResponseDto,
    categories: ICategory[]
}
import { ICategory } from "../../models/Categories";
import { IEstablishments } from "../../models/Establishments";

export interface IEstablishmentMenuItems {
    company: IEstablishments,
    categories: ICategory[]
}
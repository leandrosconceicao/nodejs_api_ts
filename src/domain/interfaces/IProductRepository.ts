import { IProduct, ProductFilters } from "../types/IProduct";

export interface IProductRepository {
    
    findAll(query: ProductFilters) : Promise<IProduct[]>;

    findOne(id: string) : Promise<IProduct>;

    add(data: IProduct) : Promise<IProduct>;

    delete(id: string) : Promise<void>;

    update(id: string, data: Partial<IProduct>) : Promise<IProduct>;

}
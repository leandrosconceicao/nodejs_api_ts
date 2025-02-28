import { IProductAddOne } from "../types/IProduct";

export interface IAddonesRepository {

    findAll(storeCode: string) : Promise<IProductAddOne[]>;

    findOne(id: string) : Promise<IProductAddOne>;

    add(data: IProductAddOne) : Promise<IProductAddOne>;

    update(id: string, data: object) : Promise<IProductAddOne>;

    delete(id: string) : Promise<void>;

    patch(id: string, movement: 'pull' | 'push', item: {name?: string, price?: number}) : Promise<void>;
}
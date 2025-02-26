import { IApp, QuerySearch } from "../types/IApp";

export default interface IAppRepository {

    findOne(id: string) : Promise<IApp>;

    add(newApp: IApp) : Promise<IApp>;

    delete(id: string) : Promise<IApp>;

    update(id: string, newData: Partial<IApp>) : Promise<IApp>;

    validateVersion(appName: string, version: number) : Promise<IApp>;

    findAll(query: QuerySearch) : Promise<IApp[]>;
}
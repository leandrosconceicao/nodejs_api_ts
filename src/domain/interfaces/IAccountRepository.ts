import { IAccount, IAccountSearch, Receipt } from "../../models/Accounts";

export default interface IAccountRepository {

    findAll(query: IAccountSearch) : Promise<IAccount[]>;
    findOne(id: string) : Promise<Receipt>;
    delete(id: string) : Promise<IAccount>;
    update(id: string, data: object) : Promise<IAccount>;
    accountIsOpen(id: string) : Promise<boolean>;
    addNew(newAccount: Partial<IAccount>) : Promise<IAccount>;
}
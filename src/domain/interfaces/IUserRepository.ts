import { IUsers, IUserSearchQuery } from "../../models/Users";

export default interface IUserRepository {
    addUser(data: IUsers) : Promise<IUsers>;

    delete(id: string, updatedById: string) : Promise<IUsers>;

    findOne(id: string) : Promise<IUsers>;

    findAll(query: IUserSearchQuery) : Promise<Array<IUsers>>;

    updateUserToken(id: string, token: string) : Promise<void>;

    updateUser(id: string, data: Partial<IUsers>) : Promise<IUsers>;

    autenticateUser(email: string, password: string) : Promise<IUsers>;

    updateUserPassword(userId: string, activePassword: string, newPassword: string) : Promise<void>;
}
import { injectable, registry, delay } from "tsyringe";
import IUserRepository from "../domain/interfaces/IUserRepository";
import { IUsers, IUserSearchQuery, Users } from "../models/Users";
import mongoose from "mongoose";
import NotFoundError from "../models/errors/NotFound";
import ForbiddenAcessError from "../domain/exceptions/ForbiddenAcessError";
import UnauthorizedError from "../models/errors/UnauthorizedError";
import ApiResponse from "../models/base/ApiResponse";
import PassGenerator from "../utils/passGenerator";

var ObjectId = mongoose.Types.ObjectId;

@injectable()
@registry([
    {
        token: `IUserRepository`,
        useToken: delay(() => MongoUserRepository)
    }
])
export default class MongoUserRepository implements IUserRepository {

    async updateUserPassword(userId: string, activePassword: string, newPassword: string): Promise<void> {
        const updateProcess = await Users.updateOne({
            _id: userId,
            pass: new PassGenerator(activePassword).build()
        }, {
            pass: new PassGenerator(newPassword).build()
        });
        
        if (updateProcess.modifiedCount == 0) {
            throw ApiResponse.unauthorized("Usuário inválido ou credenciais inválidas");
        }
    }

    async autenticateUser(email: string, password: string): Promise<IUsers> {
        const user = await Users.findOne({
            email,
            pass: password
        })
            .select({ pass: 0 })
            .populate("establishmentDetail")

        if (!user || user.deleted === true)
            throw new UnauthorizedError("Dados incorretos ou inválidos.")


        if (!user.isActive)
            throw new ForbiddenAcessError("Usuário não está ativo")

        return user;
    }

    updateUser(id: string, data: Partial<IUsers>): Promise<IUsers> {
        return Users.findByIdAndUpdate(id, data, { new: true });
    }

    async updateUserToken(id: string, token: string): Promise<void> {
        await Users.findByIdAndUpdate(id, {
            "token": token
        });
    }

    findAll(query: IUserSearchQuery): Promise<Array<IUsers>> {
        return Users.find(query).select({
            pass: 0
        })
    }

    async findOne(id: string): Promise<IUsers> {
        const user = await Users.findById(id)
            .populate("establishmentDetail");

        if (!user)
            throw new NotFoundError("Usuário não localizado");

        return user;
    }

    addUser(data: IUsers): Promise<IUsers> {
        return Users.create(data);
    }

    delete(id: string, updatedById: string): Promise<IUsers> {
        return Users.findOneAndUpdate({
            _id: new ObjectId(id)
        }, {
            $set: {
                deleted: true,
                updatedBy: updatedById,
            }
        }, {
            new: true
        });
    }
}
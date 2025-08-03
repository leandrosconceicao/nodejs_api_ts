import { injectable, registry, delay } from "tsyringe";
import IAppRepository from "../domain/interfaces/IAppRepository";
import { IApp, QuerySearch } from "../domain/types/IApp";
import Apps from "../models/Apps";
import BadRequestError from "../models/errors/BadRequest";
import NotFoundError from "../models/errors/NotFound";

@injectable()
@registry([
    {
        token: `IAppRepository`,
        useToken: delay(() => MongoAppRepository)
    }
])
export class MongoAppRepository implements IAppRepository {

    findAll(query: QuerySearch): Promise<IApp[]> {
        return Apps.find(query);
    }

    async update(id: string, newData: Partial<IApp>): Promise<IApp> {
        
        await this.findOne(id);

        return Apps.findByIdAndUpdate(id, newData)

    }

    async validateVersion(appName: string, version: number): Promise<IApp> {
        const app = await Apps.findOne({
            appsName: appName
        })

        if (!app)
            throw new NotFoundError("App não localizado")

        const serverVersion = parseInt(app.version.replaceAll(".", ""));
        const hasNewVersion =  serverVersion > version;
        if (hasNewVersion) 
            throw new BadRequestError("Há uma nova versão do aplivativo disponível para atualização");

        return app;        
    }

    async delete(id: string) : Promise<IApp> {
        const app = await this.findOne(id);

        return Apps.findOneAndDelete({
            _id: app.id
        }, {
            new: true
        })
    }


    add(newApp: IApp): Promise<IApp> {
        return Apps.create(newApp);
    }

    findOne = async (id: string): Promise<IApp> => {
        const app = await Apps.findById(id);

        if (!app)
            throw new NotFoundError("App não localizado");

        return app;
    }

}
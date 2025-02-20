import { delay, inject, injectable, registry } from "tsyringe";
import IEstablishmentRepository from "../domain/interfaces/IEstablishmentRepository";
import { Establishments, IEstablishments } from "../models/Establishments";
import NotFoundError from "../models/errors/NotFound";
import mongoose from "mongoose";
import ICloudService from "../domain/interfaces/ICloudService";
import { OrderType } from "../models/Orders";
import BadRequestError from "../models/errors/BadRequest";

@injectable()
@registry([
    {
        token: `IEstablishmentRepository`,
        useToken: delay(() => MongoEstablishmentRespository)
    }
])
export default class MongoEstablishmentRespository implements IEstablishmentRepository {

    constructor(
        @inject("ICloudService") private readonly service: ICloudService
    ) {}

    async validateDiscount(id: string, discount?: number): Promise<void> {
        
        if (!discount) return;
        
        const store = await this.findOne(id);
        
        if (!store?.maxDiscountAllowed) return;

        if ( discount > store.maxDiscountAllowed)
            throw new BadRequestError(`Desconto solicitado é maior que o permitido.`)
    }

    async checkOpening(id: string, orderType: OrderType): Promise<void> {

        const establishment = await this.findOne(id);

        if (!establishment.services.customer_service.enabled) {
            throw new BadRequestError("Estabelecimento não está aberto no momento.");
        }
        if (orderType === "delivery") {
            if (!establishment.services.delivery.enabled) {
                throw new BadRequestError("Serviço de delivery não está disponível no momento.");
            }
        }
        if (orderType === "withdraw") {
            if (!establishment.services.withdraw.enabled) {
                throw new BadRequestError("Serviço de retira não está disponível no momento.");
            }
        }
    }

    async update(id: string, data: Partial<IEstablishments>): Promise<IEstablishments> {
        if (data.dataImage) {
            data.logo = await this.service.uploadFile({
                data: data.dataImage.data,
                path: `assets/${id}/${data.dataImage.path}`
            });
        }
        return Establishments.findByIdAndUpdate(id, data, {
            new: true
        });
    }

    async delete(id: string): Promise<IEstablishments> {
        const process = await Establishments.findOneAndUpdate({
            _id: new mongoose.Types.ObjectId(id)
        }, {
            $set: {
                deleted: true
            }
        });
        return process;
    }

    async add(newEstablishment: IEstablishments): Promise<IEstablishments> {
        if (newEstablishment.dataImage) {
            newEstablishment.logo = await this.service.uploadFile({
                data: newEstablishment.dataImage.data,
                path: `assets/logo/${newEstablishment.dataImage.path}`
            })
        }
        return Establishments.create(newEstablishment,)
    }

    findAll(storeCode?: string): Promise<Array<IEstablishments>> {
        return Establishments.find(storeCode ? { _id: storeCode } : undefined).select({ ownerId: 0 });
    }

    async findOne(id: string): Promise<IEstablishments> {

        const establishment = await Establishments.findById(id);

        if (!establishment)
            throw new NotFoundError("Estabelecimento não localizado");

        return establishment;
    }

}
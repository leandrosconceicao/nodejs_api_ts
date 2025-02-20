import { IEstablishments } from "../../models/Establishments";
import { OrderType } from "../../models/Orders";

export default interface IEstablishmentRepository {

    findAll(storeCode?: string) : Promise<Array<IEstablishments>>

    findOne(id: string) : Promise<IEstablishments>

    add(newEstablishment: IEstablishments) : Promise<IEstablishments>;

    delete(id: string) : Promise<IEstablishments>

    update(id: string, data: Partial<IEstablishments>): Promise<IEstablishments>

    checkOpening(id: string, orderType: OrderType) : Promise<void>

    validateDiscount(id: string, discount?: number) : Promise<void>
}
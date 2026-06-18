import { IEstablishments } from "../../models/Establishments";
import { IClientOrders, OrderType } from "../../models/Orders";
import { IDeliveryDistrict } from "../types/IDeliveryDistrict";

export default interface IEstablishmentRepository {

    findAll(storeCode?: string) : Promise<Array<IEstablishments>>

    findOne(id: string) : Promise<IEstablishments>

    add(newEstablishment: IEstablishments) : Promise<IEstablishments>;

    delete(id: string) : Promise<IEstablishments>

    update(id: string, data: Partial<IEstablishments>): Promise<IEstablishments>

    checkOpening(id: string, orderType: OrderType) : Promise<void>

    validateDiscount(id: string, discount?: number) : Promise<void>

    addDeliveryDistrict(data: IDeliveryDistrict) : Promise<IDeliveryDistrict>;

    getDeliveryDistrict(storeCode: string, cep?: string) : Promise<IDeliveryDistrict[]>;

    deleteDeliveryDistrict(storeCode: string, id: string) : Promise<IDeliveryDistrict>;

    updateDeliveryDistrict(storeCode: string, id: string, data: Partial<IDeliveryDistrict>) : Promise<IDeliveryDistrict>;

    getClientorders(storeCode: string, clientPhoneNumber: string) : Promise<IClientOrders | undefined>;
}
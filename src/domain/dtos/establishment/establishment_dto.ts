
import { IDeliveryDistrict } from "../../../domain/types/IDeliveryDistrict";
import { GeolocationType, IEstablishments } from "../../../models/Establishments";

export class EstablishmentResponseDto implements Omit<IEstablishments, "ownerId" | "pixKey" | "telegramChatId"> {
    _id?: string;
    name: string;
    deleted?: boolean;
    location: string;
    geoLocation: { type: GeolocationType; coordinates: Array<number>; };
    logo: string;
    url: string;
    social: { instagram: string; facebook: string; whatsapp: string; email: string; phone: string; };
    services: { customer_service: boolean; delivery: boolean; withdraw: boolean; };
    tipValue: number;
    maxDiscountAllowed?: number;
    printEnabled: boolean;
    deliveryDistricts?: IDeliveryDistrict[];
    diffDaysToCleanPreparation: number;

    constructor(entity: IEstablishments) {
        this._id = entity?._id;
        this.name = entity.name;
        this.location = entity.location;
        this.geoLocation = entity.geoLocation;
        this.logo = entity.logo;
        this.url = entity.url;
        this.social = entity.social;
        this.services = entity.services;
        this.tipValue = entity.tipValue;
        this.maxDiscountAllowed = entity.maxDiscountAllowed;
        this.printEnabled = entity.printEnabled;
        this.deliveryDistricts = entity.deliveryDistricts;
        this.diffDaysToCleanPreparation = entity.diffDaysToCleanPreparation;
    }

}


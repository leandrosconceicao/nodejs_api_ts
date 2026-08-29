import { IClientBasicInfo } from "../../../models/Clients";

export class ClientDto implements Omit<IClientBasicInfo, "cgc"> {
    name?: string;
    email?: string;
    phoneNumber?: string;
    address?: string;
    city?: string;
    complement?: string;
    district?: string;
    number?: string;
    state?: string;
    zipCode?: string;

    constructor(client: IClientBasicInfo) {
        this.name = client.name;
        this.email = client.email;
        this.phoneNumber = client.phoneNumber;
        this.address = client.address;
        this.city = client.city;
        this.complement = client.complement;
        this.district = client.district;
        this.number = client.number;
        this.state = client.state;
        this.zipCode = client.zipCode;
    }
}
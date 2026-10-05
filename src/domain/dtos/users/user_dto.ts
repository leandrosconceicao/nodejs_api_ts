import MongoId from "../../../models/custom_types/mongoose_types";
import { GroupUser, IUsers } from "../../../models/Users";
import { EstablishmentResponseDto } from "../establishment/establishment_dto";

export class UserDto {
    id?: any;
    email: string;
    deleted?: boolean;
    group_user: GroupUser | "1" | "2" | "99";
    updatedBy: string | MongoId;
    updatedAt?: Date;
    changePassword: boolean;
    username: string;
    isActive: boolean;
    storeCode: string | MongoId;
    establishmentDetail?: EstablishmentResponseDto;

    constructor(user: IUsers) {
        this.id = user._id;
        this.email = user.email;
        this.deleted = user.deleted;
        this.group_user = user.group_user;
        this.updatedBy = user.updatedBy;
        this.updatedAt = user.updatedAt;
        this.changePassword = user.changePassword;
        this.username = user.username;
        this.isActive = user.isActive;
        this.storeCode = user.storeCode;
        this.establishmentDetail = user.establishmentDetail ? new EstablishmentResponseDto(user.establishmentDetail) : undefined;
    }

    static toList(users: IUsers[]) {
        return users.map((e) => new UserDto(e))
    }
}
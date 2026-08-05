import { IUsers } from "../models/Users";

declare global {
    namespace Express {
        interface Request {
            result?: any;
            autenticatedUser?: IUsers
        }
    }
}
import { IUsers } from "../../src/models/Users"

export {}

declare global {
    namespace Express {
        export interface Request {
            result: any,
            autenticatedUser: IUsers
        }
    }
}
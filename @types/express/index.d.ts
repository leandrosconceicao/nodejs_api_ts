export {}

declare global {
    namespace Express {
        export interface Request {
            result: any
        }
    }
}
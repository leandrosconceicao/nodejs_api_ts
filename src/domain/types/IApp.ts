import { z } from "zod";

export interface IApp {
    id?: string,
    appsName: string,
    version: string,
    releaseDate: Date | string
}

export const appValidation = z.object({
    appsName: z.string().min(1),
    version: z.string().min(1),
    releaseDate: z.string().datetime({offset: true})
});

export interface QuerySearch {
    _id?: string,
    appsName?: string | RegExp,
    version?: string,
}
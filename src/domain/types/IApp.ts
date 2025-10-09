import { z } from "zod";

export interface IApp {
    id?: string,
    appsName: string,
    version: string,
    releaseDate: Date | string,
    url: string
}

export const appValidation = z.object({
    appsName: z.string().min(1),
    version: z.string().min(1),
    releaseDate: z.string().datetime({offset: true}),
    url: z.string().url().optional()
});

export const appUpdateValidation = z.object({
    appsName: z.string().min(1).optional(),
    version: z.string().min(1).optional(),
    releaseDate: z.string().datetime({offset: true}).optional(),
    url: z.string().url().optional()
});

export interface QuerySearch {
    _id?: string,
    appsName?: string | RegExp,
    version?: string,
}
import mongoose from "mongoose";
import {z} from "zod";
import { IDeliveryDistrict } from "../domain/types/IDeliveryDistrict";

const OPENING_VALIDATION = z.object({
    start: z.string().regex(RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$")).optional(),
    end: z.string().regex(RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$")).optional(),
});

const SERVICES_VALIDATION = z.object({
    customer_service: z.boolean().optional(),
    delivery: z.boolean().optional(),
    withdraw: z.boolean().optional(),
});

const SOCICAL_VALIDATION = z.object({
    instagram: z.string().optional(),
    facebook: z.string().optional(),
    whatsapp: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional()
});

const establishmentAttributes = z.object({
    name: z.string().min(1),
    location: z.string().optional(),
    ownerId: z.string().min(11).max(14),
    logo: z.string().optional(),
    opening_hours: OPENING_VALIDATION.optional(),
    pixKey: z.string().optional(),
    telegramChatId: z.string().optional(),
    url: z.string().optional(),
    social: SOCICAL_VALIDATION.optional(),
    services: SERVICES_VALIDATION.optional(),
    geoLocation: z.object({
        type: z.string().default("Point"),
        coordinates: z.array(z.number()),
    }).optional(),
    tipValue: z.number().default(0.0),
    maxDiscountAllowed: z.number().optional()
});

const establishmentUpdateValidation = z.object({
    name: z.string().min(1).optional(),
    location: z.string().optional(),
    ownerId: z.string().min(11).max(14).optional(),
    logo: z.string().optional(),
    pixKey: z.string().optional(),
    telegramChatId: z.string().optional(),
    url: z.string().optional(),
    social: SOCICAL_VALIDATION.optional(),
    opening_hours: OPENING_VALIDATION.optional(),
    services: SERVICES_VALIDATION.optional(),
    geoLocation: z.object({
        type: z.string().default("Point"),
        coordinates: z.array(z.number()),
    }).optional(),
    tipValue: z.number().default(0.0),
    maxDiscountAllowed: z.number()
        .min(1, {
            message: "Valor não pode ser menor do que 1"
        })
        .max(99.99, {
            message: "Valor não pode ser maior do que 99.99"
        })
        .optional(),
    printEnabled: z.boolean().optional()
});

const schema = new mongoose.Schema({
    name: {type: String, required: [true, "Parametro (name) é obrigatório"] },
    location: {type: String, default: ""},   
    geoLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: {
                values: ['Point'],
                message: "O tipo {VALUE} não é um valor de TYPE permitido"
            }
        },
        coordinates: [{type: Number, required: true}]
    },
    ownerId: {type: String, required: [true, "Parametro (ownerId) é obrigatório"]},
    logo: {type: String, default: ""},
    pixKey: {type: String, default: ""},
    telegramChatId: {type: String, default: ""},
    url: {type: String, default: ""},
    social: {
        instagram: {type: String, default: ""},
        facebook: {type: String, default: ""},
        whatsapp: {type: String, default: ""},
        email: {type: String, default: ""},
        phone: {type: String, default: ""},
    },
    opening_hours: {
        start: {type: String, validate: {
            validator: (value: string) => {
                return RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$").test(value);
            },
            message: (props: any) => `${props.value} é invalido`
        }},
        end: {type: String, validate: {
            validator: (value: string) => {
                return RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$").test(value);
            },
            message: (props: any) => `${props.value} é invalido`
        }}
    },
    services: {
        customer_service: Boolean,
        delivery: Boolean,
        withdraw: Boolean
    },
    tipValue: {
        type: Number,
        default: 0.0
    },
    maxDiscountAllowed: {
        type: Number
    },
    deleted: { type: Boolean, default: undefined },
    printEnabled: {type: Boolean, default: false},
    diffDaysToCleanPreparation: {type: Number, default: 5}
}, {
    versionKey: false,
    timestamps: true
});

schema.virtual("deliveryDistricts", {
    ref: "deliveryDistricts",
    localField: "_id",
    foreignField: "storeCode",
    match: { deleted: { $eq: undefined } },
});

schema.index({ name: 1, ownerId: 1, deleted: 1 }, { unique: true, partialFilterExpression: { deleted: null } });

enum GeolocationType {
    point = "Point"
}

interface IEstablishments {
    _id?: string,
    name: string,
    deleted?: boolean,
    location: string,   
    geoLocation: {
        type: GeolocationType,
        coordinates: Array<number>
    },
    ownerId: string,
    logo: string,
    pixKey: string,
    telegramChatId: string,
    url: string,
    social: {
        instagram: string,
        facebook: string,
        whatsapp: string,
        email: string,
        phone: string,
    },
    services: {
        customer_service: boolean,
        delivery: boolean,
        withdraw: boolean
    },
    tipValue: number,
    maxDiscountAllowed?: number,
    printEnabled: boolean,
    deliveryDistricts?: IDeliveryDistrict[],
    diffDaysToCleanPreparation: number
}

const Establishments = mongoose.model<IEstablishments>('establishments', schema);

export {schema, Establishments, establishmentAttributes, IEstablishments, establishmentUpdateValidation }
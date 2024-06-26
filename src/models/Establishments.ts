import mongoose from "mongoose";
import {z} from "zod";

const OPENING_VALIDATION = z.object({
    start: z.string().regex(RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$")).optional(),
    end: z.string().regex(RegExp("^([0-1][0-9]|2[0-3]):[0-5][0-9]$")).optional(),
});

const SERVICES_VALIDATION = z.object({
    customer_service: z.object({
        enabled: z.boolean().optional(),
        opening_hours: OPENING_VALIDATION.optional()
    }).optional(),
    delivery: z.object({
        enabled: z.boolean().optional(),
        opening_hours: OPENING_VALIDATION.optional()   
    }).optional(),
    withdraw: z.object({
        enabled: z.boolean().optional(),
        opening_hours: OPENING_VALIDATION.optional()
    }).optional(),
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
    createDate: z.string().datetime().optional(),
    location: z.string().optional(),
    ownerId: z.string().min(11).max(14).optional(),
    logo: z.string().optional(),
    dataImage: z.object({
        path: z.string().min(1),
        data: z.string().min(1)
    }).optional(),
    pixKey: z.string().optional(),
    telegramChatId: z.string().optional(),
    url: z.string().optional(),
    social: SOCICAL_VALIDATION.optional(),
    services: SERVICES_VALIDATION.optional(),
    geoLocation: z.object({
        type: z.string().default("Point"),
        coordinates: z.array(z.number()),
    }).optional()
});

const schema = new mongoose.Schema({
    name: {type: String, required: [true, "Parametro (name) é obrigatório"] },
    createDate: {type: Date, default: () => { return new Date() }},
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
    // isOpen: {type: Boolean, default: false},
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
    services: {
        customer_service: {
            enabled: {type: Boolean, default: false},
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
        },
        delivery: {
            enabled: {type: Boolean, default: false},
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
        },
        withdraw: {
            enabled: {type: Boolean, default: false},
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
        }
    }
}, {
    versionKey: false,
});

const Establishments = mongoose.model('establishments', schema);

export {schema, Establishments, establishmentAttributes }
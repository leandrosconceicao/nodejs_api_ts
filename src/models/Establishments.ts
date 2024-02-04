import mongoose from "mongoose";

export default mongoose.model('establishments', new mongoose.Schema({
    name: {type: String, required: [true, "Parametro (name) é obrigatório"] },
    createDate: {type: Date, default: new Date()},
    location: {type: String, default: ""},   
    isOpen: {type: Boolean, default: false},
    ownerId: {type: String, required: [true, "Parametro (ownerId) é obrigatório"]},
    logo: {type: String, default: ""},
    pixKey: {type: String, default: ""},
    telegramChatId: {type: String, default: ""},
    social: {
        instagram: {type: String, default: ""},
        facebook: {type: String, default: ""},
        whatsapp: {type: String, default: ""}
    },
    services: {
        delivery: {
            enabled: {type: Boolean, default: false},
            time: {type: Number, default: 0}
        },
        retira: {
            enabled: {type: Boolean, default: false},
            time: {type: Number, default: 0}
        }
    },
    url: {type: String, default: ""},
}, {
    versionKey: false,
}));
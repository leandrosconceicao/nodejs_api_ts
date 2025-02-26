import mongoose from "mongoose";
import { IApp } from "../domain/types/IApp";

export default mongoose.model<IApp>("apps", new mongoose.Schema({
    appsName: {
        type: String,
        unique: true,
        required: [true, "Parametro (appsName) é obrigatório"],
        lowercase: true, 
        trim: true
    },
    version: {
        type: String,
        required: [true, "Parametro (version) é obrigatório"]
    },
    releaseDate: { type: Date, default: () => { return new Date(); } }
}))
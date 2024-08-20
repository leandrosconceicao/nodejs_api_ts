import express from "express";
import cors from "cors";
import db from "../config/db";
import router from "./routes/index";
import pageNotFound from "./middlewares/pageNotFound";
import errorCatcher from "./middlewares/errorCatcher";
import { initializeApp, cert } from "firebase-admin/app";
import serviceAccount from '../firebase_config.json';
import * as dotenv from "dotenv";
import bodyParse from "body-parser";

dotenv.config();

const storageDB = process.env.FIREBASESTORAGE;

db.on("error", console.log.bind(console, "Erro de conexão"));
db.once("open", () => console.log("Conexão com o banco feita com sucesso"));

initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: storageDB
})

const app = express();

app.use(cors());
app.use(function (req, res, next) {
    req.headers['content-type'] = 'application/json';
    next();
});
app.use(bodyParse.json({
    limit: "200mb"
}))

router(app);

app.use(pageNotFound)
app.use(errorCatcher)

export default app;
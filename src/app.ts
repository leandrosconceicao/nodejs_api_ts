import express from "express";
import http from 'http';
import WebSocket from "ws";
import cors from "cors";
import db from "../config/db";
import router from "./routes/index";
import pageNotFound from "./middlewares/pageNotFound";
import errorCatcher from "./middlewares/errorCatcher";
import { initializeApp, cert } from "firebase-admin/app";
import serviceAccount from '../firebase_config.json';
import * as dotenv from "dotenv";
import bodyParse from "body-parser";
import WebSocketService from "./services/websocket_service";

let wss : WebSocket.Server<typeof WebSocket, typeof http.IncomingMessage>;

var app = express();

dotenv.config();

const storageDB = process.env.FIREBASESTORAGE;
const firebaseDb = process.env.FIREBASEDB;

db.on("error", console.log.bind(console, "Erro de conexão"));
db.once("open", () => console.log("Conexão com o banco feita com sucesso"));

initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: storageDB,
    databaseURL: firebaseDb
})

app.use(cors());
app.use(function (req, res, next) {
    if (req.headers['content-type'] && !req.headers['content-type'].includes("multipart")) {
        req.headers['content-type'] = 'application/json';
    }
    next();
});
app.use(bodyParse.json({
    limit: "200mb"
}))

app.use(function (req, res, next) {
    const websocket = new WebSocketService(wss);
    websocket.handlerRequest(req, res, next);
})

router(app);

app.use(pageNotFound)
app.use(errorCatcher)

const server = http.createServer(app);
wss = new WebSocket.Server({server, path: "/chat"});

export {server, wss};
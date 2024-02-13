import express from "express";
import cors from "cors";
import db from "../config/db";
import router from "./routes/index";
import pageNotFound from "./middlewares/pageNotFound";
import errorCatcher from "./middlewares/errorCatcher";

db.on("error", console.log.bind(console, "Erro de conexão"));
db.once("open", () => console.log("Conexão com o banco feita com sucesso"));

const app = express();

app.use(cors({ origin: "*" }));

router(app);

app.use(pageNotFound)
app.use(errorCatcher)

export default app;
import express from "express";
import cors from "cors";
import db from "./config/db";
import router from "./routes/index";

db.on("error", console.log.bind(console, "Erro de conexão"));
db.once("open", () => console.log("Conexão com o banco feita com sucesso"));

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

router(app);

// app.get("/", (req, res) => {
//     res.send(200);
// })

export default app;
import app from "./src/app";

const port = 80;

app.listen(port, () => {
    console.log(`Servidor executando em http://localhost:${port}`);
});
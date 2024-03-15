import * as dotenv from 'dotenv';
import app from "./src/app";
dotenv.config();

const port = process.env.PORT || 80;

app.listen(port);
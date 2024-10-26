import * as dotenv from 'dotenv';
import {server, wss} from "./src/app";
dotenv.config();

const port = process.env.PORT || 80;

server.listen(port);

wss.on("connection", (ws) => {
    
    console.log(`Cliente conectado ${new Date()}`)
    
    ws.on("message", (msg) => {
        wss.clients.forEach((e) => {
            if (e.OPEN) 
                e.send(JSON.stringify(msg));
            
        })
    });
})
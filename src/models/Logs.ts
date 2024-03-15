import mongoose from "mongoose";
import orderLogSchema from "../models/orders/order_logs";

const logsSchema = new mongoose.Schema({
    created_at: {type: Date, default: () => { return new Date() }},
    route: {type: String},
    request_headers: {type: Object},
    request_body: {type: Object},
    method: {type: String},
    error: {type: Object},
    action: {type: orderLogSchema}
});

const logs = mongoose.model('logs', logsSchema);

export default logs;


import mongoose from "mongoose";

export default mongoose.model('users', new mongoose.Schema({
    email: {type: String, unique: true},
    pass: {type: String},
    group_user: {type: String, default: '1',
    enum: {
        values: ['1', '2', '99'],
        message: "O tipo {VALUE} não é um valor permitido"
        }
    },
    username: {type: String},
    isActive: {type: Boolean, default: false},
    establishments: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "establishments"
    }],
    token: {type: String, default: ""},
}))



import mongoose from "mongoose";
var ObjectId = mongoose.Schema.Types.ObjectId;

export default mongoose.model('users', new mongoose.Schema({
    email: {type: String},
    pass: {type: String},
    deleted: {type: Boolean},
    group_user: {type: String, default: '1',
    enum: {
        values: ['1', '2', '99'],
        message: "O tipo {VALUE} não é um valor permitido"
        }
    },
    updatedBy: {type: ObjectId, ref: "users"},
    updatedAt: {type: Date},
    createDate: {type: Date, default: () => {
        return new Date();
    }},
    changePassword: {type: Boolean, default: false},
    username: {type: String},
    isActive: {type: Boolean, default: false},
    establishments: [{
        type: ObjectId,
        ref: "establishments"
    }],
    token: {type: String, default: ""},
}))



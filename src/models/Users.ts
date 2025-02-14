import z from 'zod';
import mongoose from "mongoose";
import { idValidation } from '../utils/defaultValidations';
import PassGenerator from "../utils/passGenerator";
import MongoId from './custom_types/mongoose_types';
var ObjectId = mongoose.Schema.Types.ObjectId;

const userValidaton = z.object({
    email: z.string(),
    pass: z.string().transform((pass) => {
        return new PassGenerator(pass).build();
    }),
    deleted: z.boolean().optional(),
    group_user: z.enum([
            "1", "2", "99"
        ]).default("1").optional(),
    updatedBy: idValidation.optional(),
    changePassword: z.boolean().default(false).optional(),
    username: z.string().min(1),
    isActive: z.boolean().default(true).optional(),
    storeCode: idValidation,
    token: z.string().min(1).optional(),
});

const userPatchValidation = z.object({
    email: z.string().min(1).optional(),
    pass: z.string().min(1).optional(),
    group_user: z.enum(["1", "2", "99"]).optional(),
    changePassword: z.boolean().optional(),
    username: z.string().min(1).optional(),
    isActive: z.boolean().optional(),
    token: z.string().min(1).optional(),
  });


enum GroupUser {
    admin = "1",
    operator = "2",
    super = "99"
}

interface IUsers {
    id?: any,
    email: string,
    pass: string,
    deleted?: boolean,
    group_user: GroupUser | "1" | "2" | "99",
    // group_user: {
    //     type: String, default: '1',
    //     enum: {
    //         values: ['1', '2', '99'],
    //         message: "O tipo {VALUE} não é um valor permitido"
    //     }
    // },
    updatedBy: string | MongoId,
    updatedAt?: Date,
    changePassword: boolean,
    username: string,
    isActive: boolean,
    storeCode: string | MongoId
    // establishments: [{
    //     type: ObjectId,
    //     ref: "establishments"
    // }],
    token?: string,
}

const userSchema = new mongoose.Schema({
    email: {type: String},
    pass: {type: String},
    deleted: {type: Boolean},
    group_user: {
        type: String, default: '1',
        enum: {
            values: ['1', '2', '99'],
            message: "O tipo {VALUE} não é um valor permitido"
        }
    },
    updatedBy: {type: ObjectId, ref: "users"},
    updatedAt: {type: Date},
    changePassword: {type: Boolean, default: false},
    username: {type: String},
    isActive: {type: Boolean, default: false},
    storeCode: {type: ObjectId, ref: "establishments", required: [true, "Código do estabelecimento é obrigatório"]},
    token: {type: String, default: ""},
}, {
    timestamps: true
});

userSchema.index({ email: 1, storeCode: 1, deleted: 1 }, { unique: true, partialFilterExpression: { deleted: null } });

userSchema.virtual("establishmentDetail", {
    ref: "establishments",
    foreignField: "_id",
    localField: "storeCode",
    justOne: true
})

userSchema.set('toObject', { virtuals: true });
userSchema.set('toJSON', { virtuals: true });

const Users = mongoose.model<IUsers>('users', userSchema);


export {Users, userValidaton, userPatchValidation, IUsers};
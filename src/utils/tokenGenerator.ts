import Jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { IUsers } from '../models/Users';

const jwtKey = process.env.CHAVE_JWT || "";

export default class TokenGenerator {
    static generate(user: IUsers) {
        return Jwt.sign({
            id: user.id,
            group_user: user.group_user
        }, jwtKey, {expiresIn: '12h'},);
    }

    static verify(token: string) {
        return Jwt.verify(token, jwtKey);
    }

    static getToken() {
        return crypto.randomBytes(20).toString('hex');
    }

    static generateId() {
        return crypto.randomUUID();
    }


}
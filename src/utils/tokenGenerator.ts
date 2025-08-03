import Jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { IUsers } from '../models/Users';

export default class TokenGenerator {
    static generate(user: IUsers) {
        return Jwt.sign({
            id: user.id,
            group_user: user.group_user
        }, process.env.CHAVE_JWT, {expiresIn: '12h'},);
    }

    static verify(token: string) {
        return Jwt.verify(token, process.env.CHAVE_JWT);
    }

    static getToken() {
        return crypto.randomBytes(20).toString('hex');
    }

    static generateId() {
        return uuidv4();
    }


}
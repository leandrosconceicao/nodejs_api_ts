import Jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export default class TokenGenerator {
    static generate(account: string) {
        return Jwt.sign({id: account}, process.env.CHAVE_JWT, {expiresIn: '12h'});
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
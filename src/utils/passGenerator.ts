import crypto from 'crypto';

export default class PassGenerator {
    password: string;
    constructor(password: string) {
        this.password = password;
    }

    build() {
        return crypto.scryptSync(this.password, 'salt', 64).toString('hex');
    }
}

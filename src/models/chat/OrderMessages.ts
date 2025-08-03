import ISocketMessages from "../../domain/interfaces/ISocketMessages";

export default class OrderMessages<T> implements ISocketMessages {

    id?: string;
    user?: string;
    sentAt: Date;
    message: string;
    data?: T;

    constructor(message: string, id?: string, user?: string, data?: T) {
        this.message = message;
        this.id = id;
        this.user = user;
        this.data = data;
        this.sentAt = new Date()
    }
}
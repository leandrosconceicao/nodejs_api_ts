import {z} from 'zod';

const CHAT_MESSAGE_VALIDATION = z.object({
    id: z.string().optional(),
    user: z.string().min(1),
    message: z.string().min(1),
});

export {CHAT_MESSAGE_VALIDATION}
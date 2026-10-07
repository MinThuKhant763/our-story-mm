import {z} from 'zod';
export const replySchema=z.object({requestId:z.string().uuid(),name:z.string().trim().min(1).max(60),message:z.string().trim().min(1).max(2000),website:z.string().max(0).optional()});

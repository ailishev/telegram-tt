import { PrismaClient, ChatType, MessageType } from '../../prisma/generated/client/index.js';

export { ChatType, MessageType };
export const prisma = new PrismaClient();

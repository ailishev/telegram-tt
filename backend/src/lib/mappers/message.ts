import type { Message } from '@prisma/client';

import { ensureDate, ensureString } from './common';

export type MessageDTO = {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  type: Message['type'];
  replyToId?: string;
  forwardFromId?: string;
  createdAt: string;
  editedAt?: string;
  isDeleted: boolean;
};

export function toMessageDTO(dbMessage: Message): MessageDTO {
  const id = ensureString(dbMessage.id, 'message.id');
  const chatId = ensureString(dbMessage.chatId, 'message.chatId');
  const senderId = ensureString(dbMessage.senderId, 'message.senderId');
  const createdAt = ensureDate(dbMessage.createdAt, 'message.createdAt');

  return {
    id,
    chatId,
    senderId,
    content: dbMessage.content ?? '',
    type: dbMessage.type,
    replyToId: dbMessage.replyToId || undefined,
    forwardFromId: dbMessage.forwardFromId || undefined,
    createdAt: createdAt.toISOString(),
    editedAt: dbMessage.editedAt?.toISOString(),
    isDeleted: dbMessage.isDeleted,
  };
}

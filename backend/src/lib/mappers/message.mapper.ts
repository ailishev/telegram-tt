import type { Message } from '@prisma/client';

import { bigIntToString } from './id';

export type MessageMapperDTO = {
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

export function mapMessage(db: Message): MessageMapperDTO {
  return {
    id: bigIntToString(db.id, 'message.id'),
    chatId: bigIntToString(db.chatId, 'message.chatId'),
    senderId: bigIntToString(db.senderId, 'message.senderId'),
    content: db.content ?? '',
    type: db.type,
    replyToId: db.replyToId ? db.replyToId.toString() : undefined,
    forwardFromId: db.forwardFromId ? db.forwardFromId.toString() : undefined,
    createdAt: db.createdAt.toISOString(),
    editedAt: db.editedAt?.toISOString(),
    isDeleted: db.isDeleted,
  };
}

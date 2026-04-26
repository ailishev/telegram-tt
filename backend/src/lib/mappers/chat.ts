import type { Chat, ChatMember } from '@prisma/client';

import { ensureDate, ensureString } from './common';

type MemberDTO = {
  userId: string;
  role: ChatMember['role'];
  joinedAt: string;
  unread: number;
};

export type ChatDTO = {
  id: string;
  type: Chat['type'];
  title?: string;
  ownerId: string;
  createdAt: string;
  members?: MemberDTO[];
};

export function toChatDTO(chat: Chat, members?: ChatMember[]): ChatDTO {
  return {
    id: ensureString(chat.id, 'chat.id'),
    type: chat.type,
    title: chat.title || undefined,
    ownerId: ensureString(chat.ownerId, 'chat.ownerId'),
    createdAt: ensureDate(chat.createdAt, 'chat.createdAt').toISOString(),
    members: members?.map((member) => ({
      userId: ensureString(member.userId, 'chatMember.userId'),
      role: member.role,
      joinedAt: ensureDate(member.joinedAt, 'chatMember.joinedAt').toISOString(),
      unread: member.unread,
    })),
  };
}

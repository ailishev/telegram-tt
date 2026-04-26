import type { Chat, ChatMember } from '@prisma/client';

import { ensureDate } from './common';
import { bigIntToString } from './id';

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
    id: bigIntToString(chat.id, 'chat.id'),
    type: chat.type,
    title: chat.title || undefined,
    ownerId: bigIntToString(chat.ownerId, 'chat.ownerId'),
    createdAt: ensureDate(chat.createdAt, 'chat.createdAt').toISOString(),
    members: members?.map((member) => ({
      userId: bigIntToString(member.userId, 'chatMember.userId'),
      role: member.role,
      joinedAt: ensureDate(member.joinedAt, 'chatMember.joinedAt').toISOString(),
      unread: member.unread,
    })),
  };
}

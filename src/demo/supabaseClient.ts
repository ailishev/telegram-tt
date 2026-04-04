import type { MockMessage, MockTypes } from '../lib/gramjs/client/mockUtils/MockTypes';

import { getStoredSession } from './fakeAuth';
import { isDemoApiConfigured, selectRows } from './api/client';

type SupabaseProfile = {
  id: string;
  auth_user_id?: string;
  phone_number?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  display_name?: string;
  bio?: string;
};

type SupabaseMessage = {
  id: number;
  dialog_id: string;
  sender_profile_id: string;
  content?: string;
  created_at?: string;
  reply_to_message_id?: number;
};

function toUnixSeconds(date?: string) {
  if (!date) return Math.floor(Date.now() / 1000);
  const value = Math.floor(new Date(date).getTime() / 1000);
  return Number.isFinite(value) ? value : Math.floor(Date.now() / 1000);
}

export const isSupabaseConfigured = isDemoApiConfigured;

export async function buildMockDataFromSupabase(): Promise<MockTypes> {
  const session = getStoredSession();
  const accessToken = session?.accessToken;

  const profiles = await selectRows<SupabaseProfile>('profiles', '*', '', accessToken).catch(() => []);
  const messages = await selectRows<SupabaseMessage>('messages', '*', '', accessToken).catch(() => []);

  const currentProfile = profiles.find((profile) => profile.phone_number === session?.phoneNumber) || profiles[0];
  const currentUserId = String(currentProfile?.id || session?.userId || '1');

  const visibleDialogs = [{
    id: currentUserId,
    type: 'private' as const,
    title: 'Saved Messages',
  }];

  const mockUsers: any[] = profiles.map((profile) => ({
    id: String(profile.id),
    ...(String(profile.id) === currentUserId ? { self: true as const } : undefined),
    firstName: profile.first_name || profile.display_name || 'User',
    lastName: profile.last_name || '',
    username: profile.username,
    phone: profile.phone_number,
    status: undefined,
  }));

  if (!mockUsers.some((user) => user.id === currentUserId)) {
    mockUsers.unshift({
      id: currentUserId,
      self: true as const,
      firstName: currentProfile?.first_name || 'User',
      lastName: currentProfile?.last_name || '',
      username: currentProfile?.username,
      phone: session?.phoneNumber,
      status: undefined,
    });
  }

  const channels: any[] = [];

  const dialogIds = [currentUserId];

  const messagesByDialog: Record<string, MockMessage[]> = {};
  messages
    .filter((message) => dialogIds.includes(String(message.dialog_id)))
    .forEach((message) => {
      const peerId = String(message.dialog_id);
      if (!messagesByDialog[peerId]) messagesByDialog[peerId] = [];

      messagesByDialog[peerId].push({
        id: Number(message.id),
        message: message.content || '',
        ...(String(message.sender_profile_id) === currentUserId ? { out: true as const } : undefined),
        date: toUnixSeconds(message.created_at),
        ...(message.reply_to_message_id ? { replyToMsgId: message.reply_to_message_id } : undefined),
      });
    });

  dialogIds.forEach((peerId) => {
    if (!messagesByDialog[peerId]) messagesByDialog[peerId] = [];
    messagesByDialog[peerId].sort((a, b) => a.id - b.id);
  });

  return {
    users: mockUsers,
    chats: [],
    channels,
    dialogs: {
      active: dialogIds.map((id) => ({ id })),
      archived: [],
    },
    messages: messagesByDialog,
    availableReactions: [],
    documents: [],
    dialogFilters: [],
    topPeers: dialogIds,
  } as MockTypes;
}

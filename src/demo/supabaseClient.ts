import type { MockMessage, MockTypes } from '../lib/gramjs/client/mockUtils/MockTypes';

type SupabaseUser = {
  id: string | number;
  username?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  status?: string;
  bio?: string;
  is_current?: boolean;
};

type SupabaseDialog = {
  id: string | number;
  type: 'private' | 'group' | 'channel';
  title?: string;
  peer_id: string | number;
  unread_count?: number;
  pinned?: boolean;
  updated_at?: string;
};

type SupabaseMessage = {
  id: number;
  dialog_id: string | number;
  sender_id: string | number;
  content?: string;
  type?: string;
  created_at?: string;
  reply_to?: number;
};

type SupabaseParticipant = {
  dialog_id: string | number;
  user_id: string | number;
  role?: string;
};

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

function getHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY!,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  } as Record<string, string>;
}

async function requestRows<T>(table: string, select: string) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  const response = await fetch(url, { headers: getHeaders() });
  if (!response.ok) {
    throw new Error(`Supabase request failed for ${table}`);
  }

  return response.json() as Promise<T[]>;
}

function toUnixSeconds(date?: string) {
  if (!date) return Math.floor(Date.now() / 1000);
  const value = Math.floor(new Date(date).getTime() / 1000);
  return Number.isFinite(value) ? value : Math.floor(Date.now() / 1000);
}

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

export async function buildMockDataFromSupabase(): Promise<MockTypes> {
  const [users, dialogs, messages, participants] = await Promise.all([
    requestRows<SupabaseUser>('users', '*'),
    requestRows<SupabaseDialog>('dialogs', '*'),
    requestRows<SupabaseMessage>('messages', '*'),
    requestRows<SupabaseParticipant>('dialog_participants', '*'),
  ]);

  const currentUser = users.find((user) => user.is_current) || users[0];
  const currentUserId = String(currentUser?.id || '1');

  const mockUsers: any[] = users.map((user) => ({
    id: String(user.id),
    ...(String(user.id) === currentUserId ? { self: true as const } : undefined),
    firstName: user.first_name || 'User',
    lastName: user.last_name || '',
    username: user.username,
    phone: user.phone,
    status: user.status === 'online' ? { wasOnline: undefined } : undefined,
  }));

  const channels: any[] = dialogs
    .filter((dialog) => dialog.type !== 'private')
    .map((dialog) => ({
      id: String(dialog.peer_id),
      title: dialog.title || `Dialog ${dialog.id}`,
      ...(dialog.type === 'group' ? { megagroup: true as const } : undefined),
      ...(dialog.type === 'channel' ? { broadcast: true as const } : undefined),
    }));

  const dialogIds = dialogs.map((dialog) => String(dialog.peer_id));

  const messagesByDialog: Record<string, MockMessage[]> = {};

  messages.forEach((message) => {
    const dialog = dialogs.find((item) => String(item.id) === String(message.dialog_id));
    if (!dialog) return;

    const peerId = String(dialog.peer_id);
    if (!messagesByDialog[peerId]) {
      messagesByDialog[peerId] = [];
    }

    messagesByDialog[peerId].push({
      id: Number(message.id),
      message: message.content || '',
      ...(String(message.sender_id) === currentUserId ? { out: true as const } : undefined),
      date: toUnixSeconds(message.created_at),
      ...(message.reply_to ? { replyToMsgId: message.reply_to } : undefined),
    });
  });

  dialogIds.forEach((peerId) => {
    if (!messagesByDialog[peerId]) {
      messagesByDialog[peerId] = [];
    }

    messagesByDialog[peerId].sort((a, b) => a.id - b.id);
  });

  participants.forEach((participant) => {
    const userId = String(participant.user_id);
    if (!mockUsers.some((user) => user.id === userId)) {
      mockUsers.push({
        id: userId,
        firstName: 'Member',
        lastName: '',
        username: undefined,
        phone: undefined,
        status: undefined,
      });
    }
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

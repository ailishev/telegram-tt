import type { MockMessage, MockTypes } from '../lib/gramjs/client/mockUtils/MockTypes';

import { getStoredSession } from './fakeAuth';

type BackendProfile = {
  id: string;
  phoneNumber?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  isVerified?: boolean;
  isPremium?: boolean;
  gifts?: Array<{
    id: string;
    title: string;
  }>;
};

type BackendDialog = {
  id: string;
  type: 'saved' | 'private' | 'group' | 'channel';
  title?: string;
  unreadCount?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
  archived?: boolean;
  pinned?: boolean;
  peer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    username?: string;
  };
};

type BackendMessage = {
  id: string;
  senderProfileId: string;
  content?: string;
  createdAt?: string;
};

function toUnixSeconds(date?: string) {
  if (!date) return Math.floor(Date.now() / 1000);
  const value = Math.floor(new Date(date).getTime() / 1000);
  return Number.isFinite(value) ? value : Math.floor(Date.now() / 1000);
}

async function callBackend<T>(path: string): Promise<T> {
  const response = await fetch(path, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Backend request failed (${path})`);
  }

  return response.json() as Promise<T>;
}

async function callBackendPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Backend request failed (${path})`);
  }

  return response.json() as Promise<T>;
}

export const isSupabaseConfigured = () => true;

export function mapProfileIdToPeerId(profileId: string, fallback = 1) {
  const digitsOnly = profileId.replace(/[^\d]/g, '').slice(0, 11);
  if (digitsOnly) {
    return `9${digitsOnly}`;
  }

  let hash = 0;
  for (let i = 0; i < profileId.length; i++) {
    hash = ((hash << 5) - hash) + profileId.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash) + 1000 + fallback;
  return `9${String(positive)}`;
}

function toNumericId(input: string, fallback: number) {
  return mapProfileIdToPeerId(input, fallback);
}

export async function buildMockDataFromSupabase(): Promise<MockTypes> {
  const session = getStoredSession();
  // eslint-disable-next-line no-console
  console.info('[dialogs][adapter] buildMockDataFromBackend start', { hasSession: Boolean(session) });

  const profilePayload = await callBackend<{ profile: BackendProfile }>('/api/profile/get-current').catch(() => ({ profile: undefined }));
  const dialogsPayload = await callBackend<{ dialogs: BackendDialog[] }>('/api/dialogs').catch(() => ({ dialogs: [] }));

  const profile = profilePayload.profile;
  const dialogs = dialogsPayload.dialogs || [];
  // eslint-disable-next-line no-console
  console.info('[dialogs][adapter] backend payload', { dialogsCount: dialogs.length, hasProfile: Boolean(profile) });

  const currentUserId = profile?.id
    ? mapProfileIdToPeerId(profile.id)
    : (session?.userId ? mapProfileIdToPeerId(session.userId) : mapProfileIdToPeerId('local-self'));

  const usersById: Record<string, any> = {
    [currentUserId]: {
      id: currentUserId,
      self: true as const,
      backendProfileId: profile?.id || session?.userId,
      firstName: profile?.firstName || 'User',
      lastName: profile?.lastName || '',
      username: profile?.username,
      phone: profile?.phoneNumber || session?.phoneNumber,
      verified: Boolean(profile?.isVerified),
      premium: Boolean(profile?.isPremium),
      botVerificationIcon: profile?.isVerified ? 1n : undefined,
      bio: profile?.bio,
      stargiftsCount: profile?.gifts?.length || 0,
    },
  };

  const dialogIds: string[] = [];
  const messagesByDialog: Record<string, MockMessage[]> = {};
  const backendDialogByPeerId: Record<string, string> = {};
  const backendProfileByPeerId: Record<string, string> = {
    [currentUserId]: profile?.id || session?.userId || '',
  };

  dialogs.forEach((dialog, index) => {
    const peerId = toNumericId(dialog.peer?.id || dialog.id, index + 2);
    dialogIds.push(peerId);
    backendDialogByPeerId[peerId] = dialog.id;

    if (dialog.peer?.id && !usersById[peerId]) {
      backendProfileByPeerId[peerId] = dialog.peer.id;
      usersById[peerId] = {
        id: peerId,
        backendProfileId: dialog.peer.id,
        firstName: dialog.peer.firstName || dialog.title || 'User',
        lastName: dialog.peer.lastName || '',
        username: dialog.peer.username,
      };
    }

    const pseudoMessageId = Number(`${index + 1}${Date.now().toString().slice(-4)}`);
    messagesByDialog[peerId] = dialog.lastMessagePreview ? [{
      id: pseudoMessageId,
      message: dialog.lastMessagePreview,
      date: toUnixSeconds(dialog.lastMessageAt),
    }] : [];
  });

  const activeDialogs = dialogIds.map((dialogId, index) => {
    const backendDialog = dialogs[index];
    return {
      id: dialogId,
      unreadCount: backendDialog?.unreadCount || 0,
      topMessage: messagesByDialog[dialogId]?.[0]?.id || 0,
      readInboxMaxId: 0,
      readOutboxMaxId: 0,
      pinned: backendDialog?.pinned,
    };
  });
  // eslint-disable-next-line no-console
  console.info('[dialogs][adapter] adapted payload', { activeDialogsCount: activeDialogs.length, usersCount: Object.keys(usersById).length });

  if (!dialogIds.includes(currentUserId)) {
    dialogIds.unshift(currentUserId);
    activeDialogs.unshift({
      id: currentUserId,
      unreadCount: 0,
      topMessage: 0,
      readInboxMaxId: 0,
      readOutboxMaxId: 0,
      pinned: true,
    } as any);
    messagesByDialog[currentUserId] = messagesByDialog[currentUserId] || [];
  }

  return {
    users: Object.values(usersById),
    chats: [],
    channels: [],
    dialogs: {
      active: activeDialogs,
      archived: [],
    },
    messages: messagesByDialog,
    availableReactions: [],
    documents: [],
    dialogFilters: [],
    topPeers: dialogIds,
    backendDialogByPeerId,
    backendProfileByPeerId,
    currentUserPeerId: currentUserId,
    currentUserProfileId: profile?.id || session?.userId,
  } as MockTypes;
}

export async function fetchDialogMessages(peerId: string, mockData: MockTypes) {
  const backendDialogId = (mockData as any).backendDialogByPeerId?.[peerId];
  if (!backendDialogId) return [] as MockMessage[];

  const payload = await callBackend<{ messages: BackendMessage[] }>(`/api/messages?dialogId=${encodeURIComponent(backendDialogId)}`);
  return payload.messages.map((message, index) => ({
    id: index + 1,
    message: message.content || '',
    date: toUnixSeconds(message.createdAt),
  }));
}

export async function sendDialogMessage(peerId: string, content: string, mockData: MockTypes) {
  const backendDialogId = (mockData as any).backendDialogByPeerId?.[peerId];
  if (!backendDialogId) return;

  await callBackendPost('/api/messages', {
    dialogId: backendDialogId,
    content,
  });
}

export async function searchBackend(query: string) {
  return callBackend<{ users: BackendProfile[]; dialogs: BackendDialog[] }>(`/api/search?q=${encodeURIComponent(query)}`);
}

export async function startPrivateDialog(username: string) {
  return callBackendPost<{ dialogId: string; created: boolean }>('/api/dialogs/start-private', { username });
}

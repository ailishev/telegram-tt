import type {
  MockBackendProfile,
  MockChannel,
  MockChat,
  MockMessage,
  MockTypes,
  MockUser,
} from '../lib/gramjs/client/mockUtils/MockTypes';

import { getStoredSession } from './fakeAuth';

type BackendProfile = {
  id: string;
  phoneNumber?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  bio?: string;
  avatarUrl?: string;
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

const SELF_PEER_ID = '1';
const HASH_SEED = 2166136261;
const HASH_MULTIPLIER = 16777619;
const HASH_OFFSET = 1000;

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

function hashToPositiveInt(input: string) {
  let hash = HASH_SEED;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, HASH_MULTIPLIER);
  }

  return (hash >>> 0) + HASH_OFFSET;
}

export function getBackendPeerId(profileId: string, isSelf = false) {
  if (isSelf) {
    return SELF_PEER_ID;
  }

  return String(hashToPositiveInt(`profile:${profileId}`));
}

function getBackendDialogPeerId(dialogId: string) {
  return String(hashToPositiveInt(`dialog:${dialogId}`));
}

function getProfileDisplayName(profile?: Pick<BackendProfile, 'firstName' | 'lastName' | 'username'>) {
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  return fullName || profile?.username || 'User';
}

function toMockBackendProfile(profile?: BackendProfile): MockBackendProfile | undefined {
  if (!profile?.id) {
    return undefined;
  }

  return {
    id: profile.id,
    phoneNumber: profile.phoneNumber,
    username: profile.username,
    firstName: profile.firstName,
    lastName: profile.lastName,
    bio: profile.bio,
    avatarUrl: profile.avatarUrl,
    isVerified: profile.isVerified,
    isPremium: profile.isPremium,
    gifts: profile.gifts,
  };
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

  const currentUserId = SELF_PEER_ID;
  const currentProfileBackendId = profile?.id;

  const usersById: Record<string, MockUser> = {
    [currentUserId]: {
      id: currentUserId,
      self: true as const,
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
  const chatsById: Record<string, MockChat> = {};
  const channelsById: Record<string, MockChannel> = {};
  const backendProfileByPeerId: Record<string, MockBackendProfile> = {};
  const peerIdByBackendProfileId: Record<string, string> = {};

  const dialogIds: string[] = [];
  const messagesByDialog: Record<string, MockMessage[]> = {};
  const backendDialogByPeerId: Record<string, string> = {};

  if (profile) {
    backendProfileByPeerId[currentUserId] = toMockBackendProfile(profile)!;
    peerIdByBackendProfileId[profile.id] = currentUserId;
  }

  dialogs.forEach((dialog, index) => {
    const isSavedDialog = dialog.type === 'saved';
    const isPrivateDialog = dialog.type === 'private';
    const peerId = isSavedDialog
      ? currentUserId
      : dialog.peer?.id
        ? getBackendPeerId(dialog.peer.id, dialog.peer.id === currentProfileBackendId)
        : getBackendDialogPeerId(dialog.id);

    dialogIds.push(peerId);
    backendDialogByPeerId[peerId] = dialog.id;

    if (dialog.peer?.id) {
      peerIdByBackendProfileId[dialog.peer.id] = peerId;
      backendProfileByPeerId[peerId] = {
        id: dialog.peer.id,
        firstName: dialog.peer.firstName,
        lastName: dialog.peer.lastName,
        username: dialog.peer.username,
      };
    }

    if (isPrivateDialog && dialog.peer?.id && !usersById[peerId]) {
      usersById[peerId] = {
        id: peerId,
        firstName: dialog.peer.firstName || getProfileDisplayName(dialog.peer),
        lastName: dialog.peer.lastName || '',
        username: dialog.peer.username,
      };
    } else if (dialog.type === 'group' && !chatsById[peerId]) {
      chatsById[peerId] = {
        id: peerId,
        title: dialog.title || 'Group',
        participantsCount: 2,
      };
    } else if (dialog.type === 'channel' && !channelsById[peerId]) {
      channelsById[peerId] = {
        id: peerId,
        title: dialog.title || 'Channel',
        broadcast: true,
      };
    }

    const pseudoMessageId = index + 1;
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

  return {
    users: Object.values(usersById),
    chats: Object.values(chatsById),
    channels: Object.values(channelsById),
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
    peerIdByBackendProfileId,
    currentProfileBackendId,
  } as MockTypes;
}

export async function fetchDialogMessages(peerId: string, mockData: MockTypes) {
  const backendDialogId = (mockData as any).backendDialogByPeerId?.[peerId];
  if (!backendDialogId) return [] as MockMessage[];

  const currentProfileBackendId = mockData.currentProfileBackendId;
  const payload = await callBackend<{ messages: BackendMessage[] }>(`/api/messages?dialogId=${encodeURIComponent(backendDialogId)}`);
  return payload.messages.map((message, index) => ({
    id: index + 1,
    message: message.content || '',
    date: toUnixSeconds(message.createdAt),
    out: currentProfileBackendId ? message.senderProfileId === currentProfileBackendId : undefined,
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
  const normalizedQuery = query.trim().replace(/^@+/, '');
  return callBackend<{ users: BackendProfile[]; dialogs: BackendDialog[] }>(`/api/search?q=${encodeURIComponent(normalizedQuery)}`);
}

export async function startPrivateDialog(params: { username?: string; targetProfileId?: string } | string) {
  const payload = typeof params === 'string' ? { username: params } : params;
  return callBackendPost<{ dialogId: string; created: boolean }>('/api/dialogs/start-private', payload);
}

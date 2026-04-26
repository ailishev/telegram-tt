import { backendFetch } from './client';

export type BackendDialog = {
  id: string;
  type: 'saved' | 'private' | 'group' | 'channel';
  title?: string;
  unreadCount?: number;
  lastMessagePreview?: string;
  lastMessageAt?: string;
};

export function getDialogs() {
  return backendFetch<{ dialogs: BackendDialog[] }>('/dialogs')
    .then((payload) => payload.dialogs);
}

import type { BackendDialog } from '../api/dialogs';

export function toTelegramDialogShape(dialog: BackendDialog) {
  return {
    id: dialog.id,
    title: dialog.title || 'Dialog',
    unreadCount: dialog.unreadCount || 0,
    lastMessagePreview: dialog.lastMessagePreview,
    lastMessageAt: dialog.lastMessageAt,
    type: dialog.type,
  };
}

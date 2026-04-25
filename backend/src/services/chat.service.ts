import { chatRepository } from '../repositories/chat.repository.js';

export const chatService = {
  getChats(userId: string) {
    return chatRepository.listForUser(userId);
  },
  getChatById(userId: string, chatId: string) {
    return chatRepository.findById(chatId, userId);
  },
  createChat(userId: string, input: { type: 'private' | 'group'; title?: string; participantIds: string[] }) {
    if (input.type === 'private') {
      const target = input.participantIds[0];
      if (!target) {
        throw new Error('private chat requires participantIds[0]');
      }
      return chatRepository.createPrivate(userId, target);
    }

    return chatRepository.createGroup(input.title || 'New group', userId, input.participantIds);
  },
};

import { messageRepository } from '../repositories/message.repository.js';

export const messageService = {
  getMessages(chatId: string, limit?: number) {
    return messageRepository.list(chatId, limit);
  },
  postMessage(input: { chatId: string; senderId: string; content: string }) {
    return messageRepository.create(input);
  },
};

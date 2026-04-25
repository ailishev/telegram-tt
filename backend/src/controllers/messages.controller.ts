import type { Request, Response } from 'express';

import { messageService } from '../services/message.service.js';

export const messagesController = {
  async getMessages(req: Request, res: Response) {
    const chatId = String(req.query.chatId || '');
    if (!chatId) {
      res.status(400).json({ error: 'chatId query parameter is required' });
      return;
    }

    const messages = await messageService.getMessages(chatId);
    res.status(200).json({ messages });
  },

  async postMessage(req: Request, res: Response) {
    const { chatId, content } = req.body;
    if (!chatId || !content) {
      res.status(400).json({ error: 'chatId and content are required' });
      return;
    }

    const message = await messageService.postMessage({
      chatId,
      senderId: req.user!.id,
      content,
    });

    res.status(201).json({ message });
  },
};

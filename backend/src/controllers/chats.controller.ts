import type { Request, Response } from 'express';

import { chatService } from '../services/chat.service.js';

export const chatsController = {
  async getChats(req: Request, res: Response) {
    const chats = await chatService.getChats(req.user!.id);
    res.status(200).json({ chats });
  },

  async createChat(req: Request, res: Response) {
    try {
      const { type, title, participantIds } = req.body;
      const chat = await chatService.createChat(req.user!.id, { type, title, participantIds });
      res.status(201).json({ chat });
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  async getChat(req: Request, res: Response) {
    const chat = await chatService.getChatById(req.user!.id, req.params.id);
    if (!chat) {
      res.status(404).json({ error: 'Chat not found' });
      return;
    }

    res.status(200).json({ chat });
  },
};

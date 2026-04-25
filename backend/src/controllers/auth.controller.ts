import type { Request, Response } from 'express';

import { authService } from '../services/auth.service.js';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const { username, email, phone, password } = req.body;
      const tokens = await authService.register({ username, email, phone, password });
      res.status(201).json(tokens);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { identity, password } = req.body;
      const tokens = await authService.login(identity, password);
      res.status(200).json(tokens);
    } catch (error) {
      res.status(401).json({ error: (error as Error).message });
    }
  },

  async me(req: Request, res: Response) {
    const me = await authService.me(req.user!.id);
    res.status(200).json({ user: me });
  },
};

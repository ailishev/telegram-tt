import type { Request, Response } from 'express';

import { userRepository } from '../repositories/user.repository.js';

export const usersController = {
  async getById(req: Request, res: Response) {
    const user = await userRepository.findById(req.params.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({ user });
  },
};

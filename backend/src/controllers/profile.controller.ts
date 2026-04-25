import type { Request, Response } from 'express';

import { userRepository } from '../repositories/user.repository.js';

export const profileController = {
  async getProfile(req: Request, res: Response) {
    const user = await userRepository.findById(req.user!.id);
    res.status(200).json({ profile: user });
  },

  async patchProfile(req: Request, res: Response) {
    const { avatar, bio, displayName } = req.body;
    const profile = await userRepository.updateProfile(req.user!.id, { avatar, bio, displayName });
    res.status(200).json({ profile });
  },
};

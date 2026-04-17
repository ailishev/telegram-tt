import type { Request, Response } from 'express';

import { ProfileService } from '../../../application/services/ProfileService.js';
import { UserService } from '../../../application/services/UserService.js';

export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly profileService: ProfileService
  ) {}

  me = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const result = await this.userService.getMe(userId);
    res.status(200).json(result);
  };

  patchProfile = async (req: Request, res: Response): Promise<void> => {
    const userId = req.userId!;
    const profile = await this.profileService.updateProfile(userId, req.body);
    res.status(200).json(profile);
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.profileService.getProfile(req.params.id);
    if (!profile) {
      res.status(404).json({ error: 'Profile not found' });
      return;
    }
    res.status(200).json(profile);
  };
}

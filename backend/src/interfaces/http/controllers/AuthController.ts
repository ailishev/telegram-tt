import type { Request, Response } from 'express';

import { AuthService } from '../../../application/services/AuthService.js';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  registerLocal = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.registerLocal(req.body);
    res.status(201).json(result);
  };

  loginLocal = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.loginLocal(req.body);
    res.status(200).json(result);
  };

  loginTelegram = async (req: Request, res: Response): Promise<void> => {
    const result = await this.authService.loginTelegram(req.body);
    res.status(200).json(result);
  };
}

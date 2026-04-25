import type { NextFunction, Request, Response } from 'express';

import { authService } from '../services/auth.service.js';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const payload = authService.verifyAccessToken(token);
    const me = await authService.me(payload.sub);

    if (!me) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    req.user = { id: me.id, username: me.username, email: me.email, phone: me.phone };
    next();
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

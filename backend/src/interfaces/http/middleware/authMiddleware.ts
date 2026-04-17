import type { NextFunction, Request, Response } from 'express';

import { JwtService } from '../../../infrastructure/security/JwtService.js';

declare module 'express-serve-static-core' {
  interface Request {
    userId?: string;
  }
}

export const authMiddleware = (jwtService: JwtService) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing bearer token' });
      return;
    }

    try {
      const token = auth.replace('Bearer ', '');
      const payload = jwtService.verify(token);
      req.userId = payload.sub;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  };
};

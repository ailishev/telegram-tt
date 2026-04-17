import type { NextFunction, Request, Response } from 'express';

import { redis } from '../../../infrastructure/cache/redisClient.js';

export const rateLimiter = (windowSeconds = 60, max = 20) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `rl:${req.ip}:${req.path}`;
    const current = await redis.incr(key);

    if (current === 1) {
      await redis.expire(key, windowSeconds);
    }

    if (current > max) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    next();
  };
};

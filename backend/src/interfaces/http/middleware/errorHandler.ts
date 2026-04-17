import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { logger } from '../../../infrastructure/logging/logger.js';

export const errorHandler = (error: unknown, req: Request, res: Response, _next: NextFunction): void => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: 'Validation failed', details: error.issues });
    return;
  }

  logger.error({ error, path: req.path }, 'Unhandled request error');
  res.status(500).json({ error: 'Internal server error' });
};

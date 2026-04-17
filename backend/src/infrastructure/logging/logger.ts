import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  base: { service: 'telegram-hybrid-backend' },
  redact: ['req.headers.authorization', 'password', 'session']
});

# Telegram Hybrid Backend

Production-focused Node.js backend that treats Telegram as an external integration while keeping local business logic and user ownership.

## Architecture

```text
src/
  domain/
    entities/
    repositories/
    services/
  application/
    ports/
    services/
  infrastructure/
    cache/
    config/
    db/
    logging/
    repositories/
    security/
    telegram/
  interfaces/
    http/
      controllers/
      middleware/
      routes/
```

## Sync strategy

1. Telegram login imports Telegram account fields to local user profile.
2. Local profile remains source of truth and can override Telegram-derived values.
3. Optional background sync can be wired by calling `TelegramService.fetchProfileByBotToken` and only updating non-overridden fields.

## API Endpoints

- `POST /api/auth/telegram`
- `POST /api/auth/local`
- `POST /api/auth/local/register`
- `GET /api/me`
- `PATCH /api/profile`
- `GET /api/profile/:id`

## Security controls

- JWT-based auth for local sessions.
- Encrypted Telegram MTProto session strings (AES-256-GCM).
- Redis sliding-window rate limiting middleware.
- zod validation for auth payloads.
- Structured logs with `pino`.

## Run

```bash
cp .env.example .env
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

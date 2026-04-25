# Standalone Backend (No Telegram / MTProto)

This backend fully replaces Telegram data dependencies with a local REST API backed by PostgreSQL + Prisma.

## Folder structure

- `src/modules` - route modules (`auth`, `users`, `profile`, `chats`, `messages`)
- `src/controllers` - HTTP controllers
- `src/services` - business logic
- `src/repositories` - Prisma data access layer
- `src/middlewares` - authentication middleware
- `prisma/schema.prisma` - relational schema

## API surface

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users/:id`
- `GET /profile`
- `PATCH /profile`
- `GET /chats`
- `POST /chats`
- `GET /chats/:id`
- `GET /messages?chatId=<uuid>`
- `POST /messages`

## Migration strategy away from GramJS

1. Find every `invokeRequest` / `GramJs.*` call in `src/api/gramjs` and `src/lib/gramjs`.
2. Replace each call-site with REST clients targeting this backend (`/chats`, `/messages`, `/profile`, `/users`).
3. Normalize API responses to the shape used in selectors.
4. Remove telegram auth (code verification / session import) and use JWT (`/auth/register`, `/auth/login`).
5. Delete `src/api/gramjs` and `src/lib/gramjs` once action creators are migrated.

## Before → After example

### Before (Telegram)
```ts
const history = await invokeRequest(new GramJs.messages.GetHistory({
  peer,
  limit: 50,
}));
```

### After (Own backend)
```ts
const response = await fetch(`/messages?chatId=${chatId}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
});
const { messages } = await response.json();
```

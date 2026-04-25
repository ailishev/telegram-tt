# Telegram-TT → Standalone Messaging Platform

## 1) New backend folder structure

```text
backend/
  prisma/
    schema.prisma
  src/
    app.ts
    server.ts
    config/
      env.ts
    controllers/
      auth.controller.ts
      users.controller.ts
      profile.controller.ts
      chats.controller.ts
      messages.controller.ts
    middlewares/
      auth.middleware.ts
    modules/
      auth/routes.ts
      users/routes.ts
      profile/routes.ts
      chats/routes.ts
      messages/routes.ts
    repositories/
      user.repository.ts
      chat.repository.ts
      message.repository.ts
    services/
      auth.service.ts
      chat.service.ts
      message.service.ts
    types/
      express.ts
```

## 2) Prisma domain model

The standalone data model removes Telegram-bound entities and centers on local users/chats/messages with JWT sessions:

- `User`
- `Profile`
- `Chat`
- `ChatParticipant`
- `Message`
- `Session`

## 3) REST endpoints implemented

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users/:id`
- `GET /profile`
- `PATCH /profile`
- `GET /chats`
- `POST /chats`
- `GET /chats/:id`
- `GET /messages?chatId=...`
- `POST /messages`

## 4) Frontend integration strategy

### Current telegram-tt

- Action creators trigger Telegram methods (GramJS/MTProto)
- Selectors consume Telegram-shaped entities

### Target

- Actions call backend REST (`/chats`, `/messages`, `/profile`, `/users`)
- Selectors consume normalized DB-backed DTOs
- Remove all call sites of `invokeRequest`, then delete `src/api/gramjs` and `src/lib/gramjs`

## 5) Before → after action transformation

### Before

```ts
const history = await invokeRequest(new GramJs.messages.GetHistory({ peer, limit: 50 }));
```

### After

```ts
const { messages } = await fetch(`/messages?chatId=${chatId}`, {
  headers: { Authorization: `Bearer ${accessToken}` },
}).then((r) => r.json());
```

## 6) Telegram logic replacement summary

- Telegram auth flow (phone code, import session) → `POST /auth/register` + `POST /auth/login` with password credentials.
- Telegram dialogs/history requests → DB queries via Prisma repositories.
- Telegram profile loading → `GET /profile` and `GET /users/:id`.
- Telegram message send APIs → `POST /messages` persisted in PostgreSQL.

## 7) Step-by-step migration execution

1. Catalog every Telegram API invocation in `src/api/gramjs` and `src/lib/gramjs`.
2. Add frontend API client wrappers for backend routes.
3. Migrate high-traffic actions first: dialogs list, open chat, send message.
4. Adapt reducers/selectors to local UUID-based entities.
5. Remove Telegram auth UI and migrate to username/email + password.
6. Delete GramJS and MTProto modules after all call-sites are replaced.

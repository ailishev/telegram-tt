# Backend v2 (Telegram-class architecture)

## Structure

- `prisma/schema.prisma`
- `src/lib` (prisma, auth, http)
- `src/modules/auth|users|chats|messages|gifts`
- `src/app/api/*` (Next.js App Router endpoints)
- `src/ws/server.ts`

## API Examples

### Register
`POST /api/auth/register`
```json
{ "username": "alice", "email": "alice@example.com", "password": "StrongPass123" }
```

### Login
`POST /api/auth/login`
```json
{ "email": "alice@example.com", "password": "StrongPass123" }
```

### Create chat
`POST /api/chats`
```json
{ "type": "group", "title": "Core Team", "userIds": ["clx...", "clx..."] }
```

### Send message
`POST /api/messages`
```json
{ "chatId": "clx...", "content": "hello", "type": "text" }
```

### Send gift
`POST /api/gifts/send`
```json
{ "chatId": "clx...", "receiverId": "clx...", "giftId": "clx...", "message": "🎁" }
```

## WS Events

- inbound: `chat:subscribe`, `chat:unsubscribe`, `typing:start`, `typing:stop`, `user:online`
- outbound: `message:new`, `message:edit`, `message:delete`, `gift:send`, `user:online`, `user:offline`, `typing:start`, `typing:stop`

## BigInt Incident Postmortem

- root cause: mixed ID contracts (`string | bigint | undefined`) in legacy RPC-driven flow
- fix: single ID standard (`string` everywhere in Prisma v2), strict mapper layer and hard runtime guards before DB writes
- result: no `undefined -> bigint` conversion path in backend v2 data flow

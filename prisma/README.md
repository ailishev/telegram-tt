# Neon + Prisma deployment flow

## Required environment variables
- `DATABASE_URL`
- `DIRECT_URL`

## Local development
1. `npm install`
2. `npm run prisma:generate`
3. `npm run prisma:migrate:dev`
4. `npm run dev`

## Production / Vercel
Build command is configured as `npm run build:vercel` in `vercel.json`.
That executes:
1. `npm run prisma:generate`
2. `npm run prisma:migrate:deploy`
3. `npm run build:production`

This ensures pending migrations are applied before frontend build.

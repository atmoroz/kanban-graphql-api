# Kanban GraphQL API

Production-oriented GraphQL API for a Kanban board system with:
- JWT authentication
- RBAC permissions (OWNER / ADMIN / MEMBER / VIEWER)
- Cursor pagination
- Search, filters, and sorting
- Realtime subscriptions (pub/sub)
- PostgreSQL (Neon) via Prisma

## Tech Stack

- Node.js `>=22.12.0`
- TypeScript
- GraphQL Yoga
- Prisma 7 + PostgreSQL adapter (`@prisma/adapter-pg`)
- Vitest

## Project Features

- Boards, columns, tasks (CRUD + move operations)
- Board members and role management
- Labels and statuses
- Activity log
- Email-based pending invites
- Public vs private board access rules

## Environment Variables

Create `.env` from `.env.example` and fill values:

```bash
cp .env.example .env
```

Required:
- `JWT_SECRET`
- `DATABASE_URL`

Optional:
- `PORT` (default `4001`)
- `JWT_EXPIRES_IN` (default `30m`)
- `EMAIL_PROVIDER` (`stub` | `resend` | `brevo`, default `stub`)
- `EMAIL_FROM`
- `RESEND_API_KEY`
- `BREVO_API_KEY`
- `APP_LOGIN_URL`
- `APP_REGISTER_URL`

## Local Run

1. Install dependencies:

```bash
npm install
```

2. Generate Prisma client:

```bash
npm run prisma:generate
```

3. Sync schema to DB (project policy: `db push`, no migration history):

```bash
npm run prisma:push
```

4. Seed demo board data:

```bash
npm run prisma:seed
```

5. Run API in development mode:

```bash
npm run dev
```

GraphQL endpoint:
- `http://localhost:4001/graphql`

## Production Run

Build and start:

```bash
npm run build
npm run start
```

Production also requires valid `DATABASE_URL` and `JWT_SECRET`.

## Tests

Run all tests:

```bash
npm test
```

Type check:

```bash
npx tsc --noEmit
```

## Seed Data

Seed script: `prisma/seed.ts`

It creates demo data using a single Prisma transaction:
- demo user
- public demo board
- statuses, columns, labels
- tasks
- task-label relations via `TaskLabel` (many-to-many)

## Release Checklist (EPIC-13)

- EPIC status matrix: `RELEASE_CHECKLIST.md`
- DB connection and sync guide: `connect-db.md`
- Epic docs: `docs/epics/`

## Deploy

Recommended free options:
- Render
- Railway
- Fly.io

Minimum deploy steps:
1. Provision PostgreSQL (Neon) and set `DATABASE_URL`.
2. Set env vars (`JWT_SECRET`, email keys if needed).
3. Run `npm run prisma:generate` and `npm run prisma:push`.
4. Build and run app (`npm run build && npm run start`).
5. Verify `https://<your-host>/graphql`.

Current deployed URL:
- `TBD`

# kanban-graphql-api
Production-grade GraphQL API for a Kanban board with pagination, RBAC, optimistic UI, and realtime-ready architecture.

## Auth

- `register(email, password, name?)` -> `AuthPayload`
- `login(email, password)` -> `AuthPayload`
- `logout` -> invalidates current JWT token in-memory
- `me` -> current user from `Authorization: Bearer <token>`

## Demo read-only mode

- All mutations require auth.
- Anonymous users can read all `PUBLIC` boards and related public data.
- `PRIVATE` boards require `Authorization: Bearer <token>` and board membership.

## Email provider (EPIC-10)

- `EMAIL_PROVIDER` (optional): `stub` | `resend` | `brevo`. Default: `stub`.
- `EMAIL_FROM` (optional): sender email address for real providers.
- `RESEND_API_KEY` (optional): required only for `EMAIL_PROVIDER=resend`.
- `BREVO_API_KEY` (optional): required only for `EMAIL_PROVIDER=brevo`.
- If provider keys are missing, service falls back to `stub` (no real sending).

## Database Sync Policy

- This project is in production, but currently uses `prisma db push` for schema sync.
- Migration history is intentionally not maintained at this stage.
- When schema becomes stable, migration-based workflow can be introduced.

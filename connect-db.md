# Connect DB Plan

## 1. Wire Prisma Client

- Add a singleton Prisma client in `src/lib/prisma.ts`.
- Keep one client instance in dev to avoid reconnect storms.
- Verify with `npm run prisma:generate`.

## 2. Migrate Auth and User flow first

- Move `register/login/me` to Prisma-backed `User`.
- Keep JWT and password hashing as-is.
- Keep compatibility with in-memory services during transition.

## 3. Migrate Boards and Memberships

- Move `Board` and `BoardMember` service logic to Prisma.
- Keep RBAC checks; replace mock lookups with DB queries.

## 4. Migrate Columns and Tasks with transactions

- Move CRUD and move logic to Prisma.
- Use `prisma.$transaction` for `moveTask` and `moveColumn` position updates.

## 5. Migrate Labels and Statuses

- Move `Label`/`Status` to DB.
- Use `TaskLabel` join model for task-label mapping.

## 6. Migrate Pending Invites and Activity

- Move `PendingInvite` and `Activity` to Prisma.
- Keep invite auto-accept on auth events.

## 7. Update tests for DB-backed services

- Keep unit tests for pure libs.
- Add integration tests for Prisma-backed services.
- Use isolated test DB strategy (or strict seeding/reset flow).

## 8. Production hardening

- Enforce startup checks for `DATABASE_URL`.
- Keep `prisma db push` as current production schema sync policy.
- Revisit migration workflow later when schema stabilizes.


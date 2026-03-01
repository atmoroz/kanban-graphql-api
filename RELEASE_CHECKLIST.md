# Release Checklist (EPIC-13)

Status snapshot for EPIC-01..12 based on current code state.

## Epic Matrix

| Epic | Status | Notes |
|---|---|---|
| EPIC-01 Foundation | Done | Server, context, errors, pagination in place. |
| EPIC-02 Boards & Columns | Done | CRUD + move logic implemented. |
| EPIC-03 Tasks | Done | CRUD + move + pagination implemented. |
| EPIC-04 Search/Filters/Sort | Done | `tasksByBoard` filters/sort/pagination + access guard. |
| EPIC-05 Auth | Done | `register`, `login`, `me`, `logout`, JWT flow implemented. |
| EPIC-06 Roles & Permissions | Done | Board member roles and permission checks implemented. |
| EPIC-06.1 Permissions Enforcement | Done | Public/private and role guards are enforced in resolvers. |
| EPIC-07 Labels & Statuses | Done | Labels/statuses + task status override implemented. |
| EPIC-08 Activity Log | Done | Activity writes on core mutations + queries by board/task. |
| EPIC-09 Optimistic & Realtime | Partial | Realtime subscriptions are present; client-side optimistic UX is app-level concern. |
| EPIC-10 Email Invites | Done | Pending invites + auto-apply on login/register + provider abstraction. |
| EPIC-11 Testing & Hardening | Done | Unit/integration test suite passing (`npm test`). |
| EPIC-12 Connect DB | Done | Prisma + Neon flow, DB-backed resolvers/services, `db push` policy. |

## Open Release Items

- Final deployed API URL is still `TBD` and must be added after deployment.
- Optional: remove transitional mock-sync layer after full production stabilization.

## Verification Commands

```bash
npm test
npx tsc --noEmit
npm run prisma:generate
npm run prisma:push
npm run prisma:seed
npm run build
```

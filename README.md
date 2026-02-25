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

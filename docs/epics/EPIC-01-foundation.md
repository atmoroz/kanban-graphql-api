# Epic 1: Foundation

**Мета:** Підняти GraphQL-сервер (Yoga), зафіксувати контракти (помилки, пагінація) та скелет структури проєкту. Без доменної логіки — тільки фундамент.

---

## У scope

- Структура проєкту за [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) (розділ «Структура проєкту»).
- Точка входу: підняття GraphQL Yoga на `ts-node-dev`.
- **Error handling:** реалізація формату помилок у `lib/errors.ts` та коди `UNAUTHORIZED` | `FORBIDDEN` | `NOT_FOUND` | `VALIDATION_FAILED` | `CONFLICT` (див. розділ «Error handling» в основному доку).
- **Пагінація:** утиліти в `lib/pagination.ts` — формування cursor, `pageInfo` (hasNext, hasPrevious, startCursor, endCursor). Контракт: тільки cursor-based, offset назовні не віддаємо.
- Скелет схеми: `graphql/schema/` (types, queries, mutations, inputs) — порожні або з одним тестовим типом/query (наприклад `health` або `version`), щоб сервер відповідав на запити.
- `package.json`, `tsconfig.json`, скрипт запуску.

## Поза scope

- Доменні сутності (Board, Task, Column тощо).
- Авторизація, мок-дані.

---

## Критерії прийняття

- [ + ] `npm run dev` піднімає Yoga, GraphQL endpoint доступний.
- [ + ] Запит до тестового query (наприклад `{ version }` або `{ health }`) повертає відповідь.
- [ + ] Помилки віддаються у форматі `message` + `extensions.code` (та за потреби `entity`, `reason`).
- [ + ] У коді є `lib/errors.ts` з константами кодів та форматуванням.
- [ + ] У коді є `lib/pagination.ts` з хелперами для cursor та pageInfo (можна поки без реальних даних).
- [ + ] Структура папок відповідає документу (graphql/, services/, data/, lib/).

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — розділи «Error handling», «Пагінація і ліміти», «Структура проєкту (бекенд)».

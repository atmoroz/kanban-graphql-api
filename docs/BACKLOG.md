# Backlog

Актуальний статус реалізації по епіках на основі коду проєкту.

## EPIC-01 Foundation — Готово

- Сервер, контекст, запуск: `src/index.ts`, `src/graphql/context.ts`
- Помилки та коди: `src/lib/errors.ts`
- Cursor pagination: `src/lib/pagination.ts`

## EPIC-02 Boards & Columns — Готово

- CRUD дошок/колонок, `moveColumn`, сортування/пагінація дошок.
- Основне: `src/graphql/resolvers/board.resolver.ts`, `src/graphql/resolvers/column.resolver.ts`, `src/services/board.service.ts`, `src/services/column.service.ts`

## EPIC-03 Tasks — Готово

- CRUD задач, `moveTask` з перерахунком позицій, `tasksByColumn`.
- Основне: `src/graphql/resolvers/task.resolver.ts`, `src/services/task.service.ts`

## EPIC-04 Search/Filters/Sort — Готово

- Є `tasksByBoard` + фільтри/сортування/пагінація: `src/services/task-search.service.ts`
- Guard для `tasksByBoard` додано: для `PUBLIC` дошки пошук доступний усім, для `PRIVATE` потрібна авторизація та роль не нижча за `VIEWER` (`src/graphql/resolvers/task-search.resolver.ts`).

## EPIC-05 Auth — Майже готово

- `register` / `login` / JWT / `me` реалізовано: `src/services/auth.service.ts`, `src/lib/auth.ts`, `src/graphql/resolvers/auth.resolver.ts`
- Прогалини: немає `logout`; публічний demo/read-only режим явно не оформлено.

## EPIC-06 Roles & Permissions — Готово

- `BoardMember` + ролі + `invite/update/remove` + перевірки прав.
- Основне: `src/services/board-member.service.ts`, `src/lib/permissions.ts`

## EPIC-06.1 Permissions enforcement — Готово

- Перевірки прав увімкнено для `boards/board/columns/tasks/labels/statuses`.
- Guard для `tasksByBoard` реалізовано в `src/graphql/resolvers/task-search.resolver.ts`.

## EPIC-07 Labels & Statuses — Готово

- CRUD labels, `boardStatuses/statusById`, `task.labelIds`, status override, auto-status при `moveTask`.
- Основне: `src/graphql/resolvers/label.resolver.ts`, `src/graphql/resolvers/status.resolver.ts`, `src/services/label.service.ts`, `src/services/status.service.ts`

## EPIC-08 Activity Log — Не зроблено

- Немає типу/query/service/mock `Activity` та запису аудиту в мутаціях.

## EPIC-09 Optimistic & Realtime — Частково

- Optimistic-поведінка по повернутих об'єктах у `move/update` є.
- Realtime subscriptions відсутні (`SDL + resolvers + pub/sub`).

## EPIC-10 Email invites — Не зроблено

- Немає сутності/queries/mutations/інтеграції з auth для `PendingInvite`.

## Пріоритет наступних кроків

1. EPIC-08: Activity Log.
2. EPIC-09: Subscriptions (мінімум контракт + заглушки, або повноцінний pub/sub).
3. EPIC-10: Email invites.
4. EPIC-05: `logout` та формалізований demo read-only режим.

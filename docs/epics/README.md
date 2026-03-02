# Епіки Kanban API

Роботу ведемо **по порядку**: кожен епік — окремий крок, реалізуємо по черзі.

| # | Епік | Файл | Коротко |
|---|------|------|--------|
| 1 | Foundation | [EPIC-01-foundation.md](./EPIC-01-foundation.md) | Сервер, контракти (помилки, пагінація), скелет схеми |
| 2 | Boards & Columns | [EPIC-02-boards-columns.md](./EPIC-02-boards-columns.md) | Дошки та колонки: CRUD, мок, резолвери |
| 3 | Tasks | [EPIC-03-tasks.md](./EPIC-03-tasks.md) | Задачі: CRUD, переміщення, список по колонці |
| 4 | Search, Filters, Sort | [EPIC-04-search-filters-sort.md](./EPIC-04-search-filters-sort.md) | Пошук, фільтри, сортування списків |
| 5 | Auth | [EPIC-05-auth.md](./EPIC-05-auth.md) | Реєстрація, вхід, JWT, me, публічний доступ (демо) |
| 6 | Roles & Permissions | [EPIC-06-roles-permissions.md](./EPIC-06-roles-permissions.md) | Учасники дошки, ролі, перевірка прав у резолверах |
| 7 | Labels & Statuses | [EPIC-07-labels-statuses.md](./EPIC-07-labels-statuses.md) | Мітки, статуси, правило Column ↔ Status |
| 8 | Activity Log | [EPIC-08-activity-log.md](./EPIC-08-activity-log.md) | Аудит: запис при мутаціях, історія по задачі/дошці |
| 9 | Optimistic & Realtime | [EPIC-09-optimistic-realtime.md](./EPIC-09-optimistic-realtime.md) | Оптимістичні мутації, підписки (реально або заглушки) |
| 10 | Email invites | [EPIC-10-email-invites.md](./EPIC-10-email-invites.md) | Інвайти по email, pending, застосування при login/register |
| 11 | Testing & Hardening | [EPIC-11-testing-and-hardening.md](./EPIC-11-testing-and-hardening.md) | Юніт/інтеграційні тести та негативні кейси |
| 12 | Connect DB | [EPIC-12-connect-db.md](./EPIC-12-connect-db.md) | Перехід на Neon/PostgreSQL через Prisma |
| 13 | Release & Deploy | [EPIC-13-release-and-deploy.md](./EPIC-13-release-and-deploy.md) | Контроль епіків, README, деплой на сервер |

**Джерело фіч і use-cases:** [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md)

**Поточний статус і backlog:** [BACKLOG.md](../BACKLOG.md)

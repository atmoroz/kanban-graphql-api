# Epic 12: Connect Database (Neon + Prisma)

**Мета:** перевести API з in-memory mock на реальну PostgreSQL БД (Neon) через Prisma, зберігши поточний GraphQL-контракт, права доступу та поведінку фіч.

---

## В scope

**Фічі:** підключення БД, Prisma-конфігурація, переведення всіх GraphQL-флоу на DB-шляхи.

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-DB1 | Запустити застосунок з `DATABASE_URL` і виконати `prisma db push` без міграцій. |
| UC-DB2 | Усі основні запити/мутації GraphQL (boards, columns, tasks, labels, statuses, members, invites, activity, search, realtime guards) працюють через Prisma. |
| UC-DB3 | `register/login/me/logout` працюють з DB-користувачами та JWT як раніше. |
| UC-DB4 | Права доступу для `PRIVATE`/`PUBLIC` дошок перевіряються через DB membership/visibility. |
| UC-DB5 | Тестовий контур залишається стабільним (test-runtime fallback), `npm test` проходить. |

**Технічні рішення (у межах цього епіка):**

- Prisma 7 + `@prisma/adapter-pg`.
- `prisma.config.ts` (новий формат Prisma), джерело підключення: `DATABASE_URL`.
- Синхронізація схеми через `prisma db push` (без `migrate dev` і без історії міграцій на поточному етапі).
- Для перехідного періоду дозволено sync у mock-масиви для сумісності тестів і не мігрованих шматків.

---

## Реалізація (high-level)

- Додати Prisma client singleton (`src/lib/prisma.ts`) і DB permission helpers (`src/lib/permissions-db.ts`).
- Для кожного домену додати persisted-функції сервісів:
  - board / board-member
  - column / task
  - label / status
  - task-search
  - pending-invite
  - activity
- Переключити GraphQL резолвери на DB-шляхи та DB permission guards.
- Оновити realtime subscribe guards на DB-перевірки.
- Підтримати тестову сумісність через test-runtime fallback і адаптацію тестів на async API там, де потрібно.

---

## Критерії прийомки

- [ ] `npm run prisma:generate` і `npm run prisma:push` успішні з валідним `DATABASE_URL`.
- [ ] У production runtime всі GraphQL резолвери працюють через Prisma (без прямих читань з mock у резолверах).
- [ ] `PUBLIC` дошки доступні на read без membership, `PRIVATE` дошки вимагають auth + роль через DB.
- [ ] `inviteByEmail`, `pendingInvites*`, `acceptPendingInvitesForUser` працюють через DB-таблицю `PendingInvite`.
- [ ] `Activity` пишеться і читається з DB, `realtime` subscribe перевіряє доступ через DB.
- [ ] `npm test` і `npx tsc --noEmit` проходять без помилок.
- [ ] Документація по підключенню (`connect-db.md`) актуальна і відповідає фактичному workflow.

---

## Вне scope

- Повний демонтаж mock-шару.
- Перехід на Prisma migrations workflow (`migrate dev/deploy`).
- Оптимізація запитів/індексів поза поточними бізнес-флоу.

---

## Примітка

Епік фіксує саме перехід на DB-шляхи в production runtime. Mock-дані можуть тимчасово залишатися для тестового контуру і backward-сумісності під час міграції.

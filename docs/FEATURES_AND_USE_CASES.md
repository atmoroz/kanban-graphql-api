# Kanban API — фічі та use-cases

## Концепція проєкту

Публічне REST/GraphQL API канбан-дошки: документація, landing, відео-курс. Мета — єдине «навчальне» API з повним набором реальних сценаріїв (фільтри, пошук, сортування, ролі, авторизація, оптимістичні кейси) для портфоліо та навчання. Бекенд: GraphQL (GraphQL Yoga) + TypeScript. БД на першому етапі — мок, далі — реальна БД.

---

## Фічі та use-cases

**Зміст фіч:** 1. Дошки · 2. Колонки · 3. Задачі · 4. Пошук і фільтрація · 5. Сортування · 6. Мітки · 7. Ролі та права · **8. Auth** · 9. Статуси · 10. Оптимістичні сценарії · 11. Пагінація · 12. Activity Log (Audit) · 13. Subscriptions (Realtime)

---

### 1. Дошки (Boards)

**Опис:** Створення, редагування та видалення дошок. У дошки є назва, опис, налаштування видимості.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-B1 | Створити дошку | name, description?, visibility? | Board |
| UC-B2 | Оновити дошку | id, name?, description?, visibility? | Board |
| UC-B3 | Видалити дошку | id | success / помилка |
| UC-B4 | Отримати дошку по id | id | Board або null |
| UC-B5 | Список дошок користувача | userId?, cursor?, limit | [Board], pageInfo |

**Правила:** Тільки власник може редагувати/видаляти. Для списку — враховувати права (свої + shared).

---

### 2. Колонки (Columns)

**Опис:** Колонки належать дошці, мають порядок (position), назву. Drag-and-drop = зміна position.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-C1 | Створити колонку | boardId, title, position? | Column |
| UC-C2 | Оновити колонку | id, title?, position? | Column |
| UC-C3 | Видалити колонку | id | success |
| UC-C4 | Перемістити колонку | id, newPosition | Column (оптимістично) |
| UC-C5 | Список колонок дошки | boardId | [Column] (відсортовано по position) |

**Правила:** position при створенні — в кінець. При переміщенні — перерахунок position у сусідніх колонок.

---

### 3. Задачі (Tasks / Cards)

**Опис:** Задачі в колонках: заголовок, опис, дедлайн, пріоритет, статус, виконавець, мітки.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-T1 | Створити задачу | columnId, title, description?, priority?, dueDate?, assigneeId? | Task |
| UC-T2 | Оновити задачу | id, title?, description?, priority?, dueDate?, assigneeId?, status?, labelIds? | Task |
| UC-T3 | Видалити задачу | id | success |
| UC-T4 | Перемістити задачу (в іншу колонку/позицію) | id, columnId, position? | Task (оптимістично) |
| UC-T5 | Отримати задачу по id | id | Task |
| UC-T6 | Список задач колонки | columnId, sort?, cursor?, limit | [Task], pageInfo |

**Правила:** При переміщенні між колонками можна оновлювати статус по маппінгу колонка → статус. Підтримка оптимістичного UI (одразу повертати оновлену задачу).

---

### 4. Пошук і фільтрація задач

**Опис:** Глобальний пошук по дошці/проєкту та фільтри по полях.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-F1 | Пошук задач по тексту | boardId, query, limit? | [Task] |
| UC-F2 | Фільтр по статусу | boardId, status[] | [Task] |
| UC-F3 | Фільтр по пріоритету | boardId, priority[] | [Task] |
| UC-F4 | Фільтр по виконавцю | boardId, assigneeId? | [Task] |
| UC-F5 | Фільтр по мітках | boardId, labelIds[] | [Task] |
| UC-F6 | Фільтр по дедлайну (прострочено / на цьому тижні / без терміну) | boardId, dueFilter | [Task] |
| UC-F7 | Комбіновані фільтри + сортування | boardId, filters, sortBy, sortOrder, cursor, limit | [Task], pageInfo |

**Правила:** Усі фільтри комбінуються через AND. Пошук — по title + description (у моку — простий substring).

---

### 5. Сортування

**Опис:** Єдиний механізм сортування списків.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-S1 | Сортування задач | sortBy: createdAt \| updatedAt \| dueDate \| priority \| title, sortOrder: ASC \| DESC | [Task] |
| UC-S2 | Сортування дошок | sortBy: name \| createdAt \| updatedAt, sortOrder | [Board] |
| UC-S3 | Сортування колонок | по position (фіксовано для колонок) | [Column] |

**Правила:** Для пріоритету — свій порядок (наприклад: critical > high > medium > low). Підтримка пагінації (cursor/limit).

---

### 6. Мітки (Labels)

**Опис:** Кольорові мітки для задач, прив'язані до дошки.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-L1 | Створити мітку | boardId, name, color? | Label |
| UC-L2 | Оновити мітку | id, name?, color? | Label |
| UC-L3 | Видалити мітку | id | success |
| UC-L4 | Список міток дошки | boardId | [Label] |
| UC-L5 | Прив'язати/відв'язати мітки до задачі | taskId, labelIds[] | Task |

---

### 7. Ролі та права доступу

**Опис:** Ролі на рівні дошки: Owner, Admin, Member, Viewer. Від цього залежать мутації та видимість.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-R1 | Запросити користувача на дошку | boardId, userId, role | BoardMember |
| UC-R2 | Змінити роль учасника | boardId, userId, role | BoardMember |
| UC-R3 | Виключити з дошки | boardId, userId | success |
| UC-R4 | Список учасників дошки | boardId | [BoardMember] |
| UC-R5 | Перевірка прав перед мутацією | boardId, requiredRole | allow / deny |

**Матриця прав (коротко):**
- Viewer: тільки читання.
- Member: + створення/редагування своїх задач.
- Admin: + управління колонками, мітками, учасниками (не Owner).
- Owner: повний доступ + видалення дошки, зміна власника.

---

### 8. Auth — авторизація та користувачі

**Опис:** Облік користувачів та аутентифікація для захисту API (публічне API — з обмеженням по ключу або JWT для «своїх» користувачів).

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-A1 | Реєстрація | email, password, name? | User + token |
| UC-A2 | Вхід | email, password | token |
| UC-A3 | Вихід / інвалідація токена | token | success |
| UC-A4 | Поточний користувач | Authorization header | User або null |
| UC-A5 | Публічний доступ (демо) | API key або без auth | read-only для демо-дошки |

**Правила:** Для «публічного навчального» API можна видати статичний API key з обмеженням (тільки певна демо-дошка, rate limit). Повні мутації — тільки по JWT.

---

### 9. Статуси задач

**Опис:** Статус задачі (open, in_progress, review, done тощо) — бізнес-стан. Колонка — контейнер в UI. Зв'язок між ними задається маппінгом.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-ST1 | Отримати доступні статуси дошки | boardId | [Status] |
| UC-ST2 | Налаштувати статуси дошки (кастом) | boardId, statuses[] | [Status] |
| UC-ST3 | Змінити статус задачі | taskId, statusId | Task |
| UC-ST4 | Авто-статус при переміщенні в колонку | taskId, columnId | Task (status по маппінгу колонки) |

**Rule (Column vs Status):**
- **Column** — це UI-контейнер (де задача відображається на дошці).
- **Status** — це бізнес-стан (логічний статус для фільтрів, звітів, правил).
- **Column** може мапитися на **рівно один** Status (у колонки один статус).
- **Task status** виводиться з її Column **АБО** явно перевизначений (якщо задано override — пріоритет у нього).

**Правила:** У моку — набір статусів за замовчуванням; пізніше — налаштовувані на рівні дошки. При створенні/переміщенні задачі в колонку статус виставляється по маппінгу колонки, якщо у задачі немає явного override.

---

### 10. Оптимістичні сценарії (Optimistic UI)

**Опис:** Мутації, які одразу повертають очікуваний стан, щоб UI міг оновитися без очікування відповіді сервера.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-O1 | Переміщення задачі (drag-and-drop) | id, columnId, position | Task (з новими columnId, position) |
| UC-O2 | Переміщення колонки | id, newPosition | Column (з новим position) |
| UC-O3 | Швидке оновлення (наприклад, чекбокс «виконано») | taskId, statusId | Task |
| UC-O4 | Ідемпотентність / повтор запиту | idempotencyKey? | той самий результат при повторі |

**Правила:** У відповіді мутації завжди повертати повний оновлений об'єкт. За потреби — підтримати idempotency key у заголовку/аргументі.

---

### 11. Пагінація та ліміти

**Опис:** Єдиний підхід до пагінації (cursor-based) та лімітів для списків.

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-P1 | Список з курсором | after?, before?, first, last? | edges, pageInfo { hasNext, hasPrevious, startCursor, endCursor } |
| UC-P2 | Обмеження розміру відповіді | limit (max 100) | обрізаний список + pageInfo |

**Правила:** GraphQL-контракт завжди cursor-based (after/before, first/last, pageInfo з курсорами). API ніколи не віддає клієнту offset. У моку можна емулювати пагінацію через offset/limit всередині, але назовні — тільки курсори та pageInfo. У реальній БД — курсор по унікальному полю (id, createdAt).

---

### 12. Activity Log (Audit)

**Опис:** Журнал дій по сутностях — хто що зробив і коли. Легка фіча, сильно піднімає рівень API (аудит, прозорість, налагодження).

| Use-case | Дія | Вхід | Результат |
|----------|-----|------|-----------|
| UC-AL1 | Отримати історію задачі | taskId, cursor?, limit? | [Activity], pageInfo |
| UC-AL2 | Отримати історію дошки | boardId, cursor?, limit? | [Activity], pageInfo |

**Activity (поля запису):**

| Поле | Тип | Опис |
|------|-----|------|
| actorId | ID | Хто виконав дію (User) |
| entityType | enum | TASK \| COLUMN \| BOARD |
| entityId | ID | id сутності |
| action | enum | CREATE \| UPDATE \| MOVE \| DELETE |
| diff | JSON / string? | Що змінилося (опційно: old/new або короткий опис) |
| createdAt | DateTime | Коли |

**Правила:** Запис у лог — при кожній мутації (створення/оновлення/переміщення/видалення). Доступ до логу — по правах дошки (бачать учасники з доступом до дошки/задачі).

---

### 13. Subscriptions (Realtime)

**Опис:** GraphQL Subscriptions (WebSocket) — підписки на зміни по дошці. В парі з Optimistic UI дають повноцінний realtime: локально одразу оновлюємо UI, по підписці отримуємо підтвердження та синхронізацію з іншими клієнтами. Реалізовувати можна пізніше, але в специфікації API мають бути зафіксовані.

| Use-case | Подія | Аргумент підписки | Payload |
|----------|-------|-------------------|---------|
| UC-SUB1 | Task created | boardId | Task |
| UC-SUB2 | Task updated | boardId | Task |
| UC-SUB3 | Column moved | boardId | Column |

**Правила:** Підписка прив'язана до `boardId` — клієнт підписується на дошку та отримує події тільки по цій дошці. Доступ — по правах (підписуватися можуть учасники дошки). Транспорт — WebSocket (наприклад, graphql-ws); за відсутності реалізації підписок у першій версії — у схемі описати, у резолверах заглушки або позначка «TODO».

---

## Зводна таблиця сутностей

| Сутність | Основні поля | Зв'язки |
|----------|--------------|---------|
| User | id, email, name, createdAt | — |
| Board | id, name, description, visibility, ownerId, createdAt, updatedAt | columns, members, labels, statuses |
| Column | id, boardId, title, position, createdAt | tasks |
| Task | id, columnId, title, description, statusId, priority, dueDate, assigneeId, position, createdAt, updatedAt | labels, assignee, comments? |
| Label | id, boardId, name, color | — |
| BoardMember | boardId, userId, role | user, board |
| Status | id, boardId, name, order, color? | — |
| Activity | id, actorId, entityType, entityId, action, diff?, createdAt | actor (User) |

---

### Error handling

Усі помилки API повертаються в єдиному форматі (GraphQL `errors[]` з полем `extensions`). Це контракт для клієнтів та навчальних матеріалів.

**Формат помилки:**

```json
{
  "message": "string",
  "extensions": {
    "code": "ERROR_CODE",
    "entity": "string (optional)",
    "reason": "string (optional)"
  }
}
```

**Коди помилок (enum):**

| Code | Коли використовувати |
|------|----------------------|
| `UNAUTHORIZED` | Немає або невалідний токен, сесія закінчилась |
| `FORBIDDEN` | Немає прав на дію (роль, не учасник дошки) |
| `NOT_FOUND` | Сутність по id не знайдена |
| `VALIDATION_FAILED` | Помилка валідації аргументів (формат, обов'язкові поля) |
| `CONFLICT` | Конфлікт стану (дублікат, порушення унікальності, несумісний стан) |

`entity` — опційно, тип або id сутності (наприклад `"Board"`, `"task:123"`). `reason` — опційно, коротке пояснення для налагодження. Реалізація — у `lib/errors.ts`.

---

## Структура проєкту (бекенд)

```
kanban-dashboard/
├── docs/
│   └── FEATURES_AND_USE_CASES.md   # цей файл
├── src/
│   ├── index.ts                    # точка входу, підняття Yoga
│   ├── graphql/                    # схема + резолвери
│   │   ├── schema/
│   │   │   ├── index.ts            # збірка схеми
│   │   │   ├── types/              # типи GraphQL (Board, Task, Column, User, ...)
│   │   │   ├── queries/
│   │   │   ├── mutations/
│   │   │   └── inputs/
│   │   └── resolvers/
│   │       ├── index.ts
│   │       ├── board/
│   │       ├── column/
│   │       ├── task/
│   │       ├── label/
│   │       ├── user/
│   │       └── auth/
│   ├── services/                   # бізнес-логіка (use-cases)
│   │   ├── board.service.ts
│   │   ├── column.service.ts
│   │   ├── task.service.ts
│   │   ├── label.service.ts
│   │   ├── auth.service.ts
│   │   └── search.service.ts
│   ├── data/                       # мок / шар даних
│   │   ├── mock/
│   │   │   ├── boards.ts
│   │   │   ├── columns.ts
│   │   │   ├── tasks.ts
│   │   │   ├── users.ts
│   │   │   └── labels.ts
│   │   └── types.ts                # загальні типи для репозиторію
│   ├── lib/
│   │   ├── auth.ts                 # JWT, перевірка прав
│   │   ├── pagination.ts           # cursor, pageInfo
│   │   └── errors.ts               # формат помилок API
│   └── config.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Варіант (на смак):** замість плоских `services/` — `modules/` по бізнес-доменах (board, task, column, auth, …): у кожному модулі свої сервіси, типи, за потреби шматки схеми/резолверів.

---

## Подальші кроки

Роботу ведемо **по епіках** (окремі файли, по порядку): [docs/epics/README.md](./epics/README.md).

1. **Epic 1** — Foundation (сервер, помилки, пагінація, скелет схеми).
2. **Epic 2** — Boards & Columns.
3. **Epic 3** — Tasks.
4. **Epic 4** — Search, Filters, Sort.
5. **Epic 5** — Auth.
6. **Epic 6** — Roles & Permissions.
7. **Epic 7** — Labels & Statuses.
8. **Epic 8** — Activity Log.
9. **Epic 9** — Optimistic & Realtime (підписки).
10. Підключення реальної БД та перенесення моку — після епіків.

Якщо потрібно, наступний крок — накидати конкретну GraphQL-схему (типи та операції) по цьому документу в межах Epic 1–2.

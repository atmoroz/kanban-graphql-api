# Epic 7: Labels & Statuses

**Мета:** Мітки на дошці та прив'язка до задач. Статуси дошки та правило Column ↔ Status: колонка мапиться на один статус, статус задачі виводиться з колонки або явного override.

---

## У scope

**Фічі:** розд. 6 «Мітки», розд. 9 «Статуси задач» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-L1 | Створити мітку (boardId, name, color?) |
| UC-L2 | Оновити мітку |
| UC-L3 | Видалити мітку |
| UC-L4 | Список міток дошки |
| UC-L5 | Прив'язати/відв'язати мітки до задачі (taskId, labelIds[]) |
| UC-ST1 | Отримати доступні статуси дошки |
| UC-ST2 | Налаштувати статуси дошки (кастом) — опційно в моку |
| UC-ST3 | Змінити статус задачі (taskId, statusId) |
| UC-ST4 | Авто-статус при переміщенні в колонку |

**Rule (Column vs Status):** Column = UI container, Status = business state. Column → рівно один Status. Task status = з колонки або явний override.

- GraphQL: типи `Label`, `Status`; для Column — поле `statusId` або зв'язок з Status; для Task — `statusId`, `labelIds` (або зв'язок labels). Mutations: create/update/delete label; updateTask з labelIds; при moveTask — виставляти status по маппінгу колонки, якщо немає override.
- Мок: маппінг columnId → statusId на дошці (дефолтні статуси: open, in_progress, review, done або свої). При створенні/переміщенні задачі — проставляти statusId по колонці.
- Сервіси: label.service; у task.service врахувати статус при move та при явній зміні статусу.

## Поза scope

- Доступ до міток/статусів по дошці перевіряється в Epic 6 (ролі). Activity log (Epic 8).

---

## Критерії прийняття

- [ + ] CRUD міток по boardId; список міток дошки.
- [ + ] У задачі можна задати/оновити labelIds; у відповіді задача віддає мітки (або id міток).
- [ + ] У дошки є набір статусів (дефолтний або кастом); колонка прив'язана до одного статусу.
- [ + ] При переміщенні задачі в колонку статус задачі виставляється по статусу колонки (якщо у задачі немає явного override).
- [ + ] Мутація зміни статусу задачі (updateTask statusId або окрема mutation) працює.
- [ + ] Фільтр по статусу (Epic 4) використовує статуси дошки.

---

## Перевірка коду (EPIC-07)

**Реалізовано:**

- **Мітки:** тип `Label` (id, boardId, name, color). CRUD: createLabel, updateLabel, deleteLabel. Query `boardLabels(boardId)`. Мок `labels.ts`, сервіс `label.service.ts`. Прив'язка до задачі: `updateTaskLabels(taskId, labelIds)`, Task має `labelIds`, при створенні задачі — порожній масив.
- **Статуси:** тип `Status` (id, boardId, name, order, color). Query `boardStatuses(boardId)`, `statusById(id)`. Мок `statuses.ts`, сервіс `status.service.ts`. Колонка має `statusId`; при створенні колонки призначається перший статус дошки (якщо є).
- **Column ↔ Status:** Column.statusId; при createColumn — boardStatuses[0].id. Task.statusId при createTask береться з column.statusId.
- **moveTask:** при перенесенні в іншу колонку, якщо у задачі немає overrideStatusId — виставляється task.statusId = targetColumn.statusId (`task.service.ts`).
- **Зміна статусу:** мутації `updateTaskStatus(taskId, statusId)` (setTaskStatusOverride) та `clearTaskStatusOverride(taskId)`. У Task є `statusId`, `overrideStatusId`.
- **Фільтр по статусу:** у task-search.service використовується `statusIds`; фільтрація по статусах дошки підтримується.
- **Права:** label/status резолвери використовують assertBoardPermission (VIEWER для читання, ADMIN для мутацій міток); task updateTaskLabels/updateTaskStatus/clearTaskStatusOverride — MEMBER.

**Виправлено при перевірці:**

- labelMutations переведено на `extend type Mutation` (замість `type Mutation`).
- У резолверах label та status: контекст типізовано як GraphQLContext, в assertBoardPermission передається `ctx.currentUser.id`; для PRIVATE дошок перевіряється наявність currentUser.
- У резолвері moveTask: аргумент приведено до імені зі схеми — використовується `args.columnId` (у схемі moveTask(id, columnId, position)).
- У резолверах updateTaskLabels, updateTaskStatus, clearTaskStatusOverride: контекст GraphQLContext, перевірка auth та передача ctx.currentUser.id в assertBoardPermission.
- Імпорти в label.service та status.service переведено на `../data/mock`.

**Примітка:** При створенні дошки статуси не створюються автоматично; при порожньому списку статусів дошки createColumn кинеть «Board has no statuses». За потреби — сідити дефолтні статуси (open, in_progress, review, done) при створенні дошки або в моку.

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «6. Мітки», «9. Статуси задач» (у т.ч. Rule Column vs Status), «Зводна таблиця сутностей».

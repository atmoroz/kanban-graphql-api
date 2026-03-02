# Epic 9: Optimistic & Realtime

**Мета:** Зафіксувати та довести оптимістичні сценарії (мутації повертають повний об'єкт; move task/column); описати та за можливості реалізувати підписки (realtime). Підписки допустимо залишити заглушками або TODO в першій версії.

---

## У scope

**Фічі:** розд. 10 «Оптимістичні сценарії», розд. 13 «Subscriptions (Realtime)» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-O1 | Переміщення задачі — відповідь з повною Task (columnId, position) |
| UC-O2 | Переміщення колонки — відповідь з повною Column (position) |
| UC-O3 | Швидке оновлення (напр. зміна статусу) — відповідь з повною Task |
| UC-O4 | Ідемпотентність (idempotencyKey?) — при повторі той самий результат |
| UC-SUB1 | Subscription: Task created (boardId) → Task |
| UC-SUB2 | Subscription: Task updated (boardId) → Task |
| UC-SUB3 | Subscription: Column moved (boardId) → Column |

- **Optimistic:** Усі мутації, що змінюють сутність (create/update/move task та column), вже повертають повний об'єкт — перевірити та за потреби доробити. Опційно: аргумент або заголовок idempotencyKey для повторних запитів (повернення кешованого результату по ключу).
- **Subscriptions:** У схемі описати підписки (наприклад `taskCreated(boardId)`, `taskUpdated(boardId)`, `columnMoved(boardId)`). Реалізація: або graphql-ws (або аналог) з публікацією подій при відповідних мутаціях, або заглушки (резолвери підписок повертають async iterator з порожнім або тестовим потоком, коментар TODO). Доступ до підписки — тільки учасники дошки (перевірка при subscribe).

## Поза scope

- Складна ідемпотентність (зберігання по ключах довше однієї сесії). Інші транспорти крім WebSocket для підписок.

---

## Критерії прийняття

- [ + ] MoveTask та moveColumn повертають повну оновлену сутність (Task/Column). updateTask при зміні статусу теж повертає повну Task.
- [ + ] У документації/схемі описані підписки taskCreated, taskUpdated, columnMoved по boardId.
- [ + ] Або підписки працюють (при мутації подія йде підписникам по boardId), або в коді явні заглушки/TODO з позначкою «реалізувати в наступній ітерації».
- [ + ] При реалізації підписок: перевірка прав на дошку при subscribe; учасники дошки отримують події.
- [ ] Опційно: idempotencyKey в одній-двох мутаціях та повернення того ж результату при повторі.

---

## Перевірка коду (EPIC-09)

**Реалізовано:**

- **Оптимістичні відповіді:** moveTask повертає `TaskRecord` (повна задача з columnId, position); moveColumn повертає `[Column!]!` (усі колонки дошки з оновленими position); createTask, updateTask, updateTaskLabels, updateTaskStatus, clearTaskStatusOverride повертають повну Task. Епік виконано.
- **Підписки в схемі:** `subscriptions/index.ts` — базовий тип Subscription; `subscriptions/realtime.ts` — extend з `taskCreated(boardId)`, `taskUpdated(boardId)`, `columnMoved(boardId)`. Типи повернення: Task!, Task!, Column!.
- **Реалізація підписок:** використовується `@graphql-yoga/subscription` (createPubSub). У резолверах: `realtime.resolver.ts` — subscribe викликає `realtimePubSub.subscribe('TASK_CREATED'|'TASK_UPDATED'|'COLUMN_MOVED', boardId)`; при мутаціях викликається `realtimePubSub.publish`: у task.resolver — TASK_CREATED після createTask, TASK_UPDATED після updateTask, moveTask, updateTaskLabels, updateTaskStatus, clearTaskStatusOverride; у column.resolver — COLUMN_MOVED після moveColumn. Події йдуть підписникам по boardId.
- **Права при subscribe:** у realtime.resolver перед підпискою викликається `assertSubscribeAccess(ctx, boardId)` — перевірка currentUser та assertBoardPermission(boardId, userId, VIEWER). Доступ тільки у учасників дошки.
- **idempotencyKey:** не реалізовано (в епіку опційно).

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «10. Оптимістичні сценарії», «13. Subscriptions (Realtime)».

---

## Example: як протестити схеми

Нижче мінімальний ручний сценарій перевірки в GraphiQL/Playground (`http://localhost:4001/graphql`).

1. Авторизуйся та візьми токен:

```graphql
mutation Login {
  login(email: "owner@example.com", password: "password123") {
    token
    user { id email }
  }
}
```

2. У headers додай:

```json
{
  "authorization": "Bearer <TOKEN>"
}
```

3. Підпишись на події (в окремій вкладці):

```graphql
subscription OnTaskCreated($boardId: ID!) {
  taskCreated(boardId: $boardId) {
    id
    title
    columnId
    position
  }
}
```

```json
{
  "boardId": "<BOARD_ID>"
}
```

4. В іншій вкладці виконай мутацію та перевір подію + повний об'єкт:

```graphql
mutation CreateTask($columnId: ID!) {
  createTask(
    columnId: $columnId
    title: "Realtime test task"
    priority: HIGH
  ) {
    id
    title
    columnId
    position
    updatedAt
  }
}
```

5. Перевірка `taskUpdated`:

```graphql
subscription OnTaskUpdated($boardId: ID!) {
  taskUpdated(boardId: $boardId) {
    id
    title
    statusId
    columnId
    position
  }
}
```

І потім, в іншій вкладці:

```graphql
mutation MoveTask($id: ID!, $columnId: ID!, $position: Int) {
  moveTask(id: $id, columnId: $columnId, position: $position) {
    id
    columnId
    position
    updatedAt
  }
}
```

6. Перевірка `columnMoved`:

```graphql
subscription OnColumnMoved($boardId: ID!) {
  columnMoved(boardId: $boardId) {
    id
    boardId
    title
    position
  }
}
```

І потім:

```graphql
mutation MoveColumn($id: ID!, $newPosition: Int!) {
  moveColumn(id: $id, newPosition: $newPosition) {
    id
    position
  }
}
```

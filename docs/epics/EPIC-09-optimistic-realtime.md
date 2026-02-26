# Epic 9: Optimistic & Realtime

**Цель:** Зафиксировать и довести оптимистичные сценарии (мутации возвращают полный объект; move task/column); описать и по возможности реализовать подписки (realtime). Подписки допустимо оставить заглушками или TODO в первой версии.

---

## В scope

**Фичи:** разд. 10 «Оптимистичные сценарии», разд. 13 «Subscriptions (Realtime)» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Действие |
|----|----------|
| UC-O1 | Перемещение задачи — ответ с полной Task (columnId, position) |
| UC-O2 | Перемещение колонки — ответ с полной Column (position) |
| UC-O3 | Быстрое обновление (напр. смена статуса) — ответ с полной Task |
| UC-O4 | Идемпотентность (idempotencyKey?) — при повторе тот же результат |
| UC-SUB1 | Subscription: Task created (boardId) → Task |
| UC-SUB2 | Subscription: Task updated (boardId) → Task |
| UC-SUB3 | Subscription: Column moved (boardId) → Column |

- **Optimistic:** Все мутации, меняющие сущность (create/update/move task и column), уже возвращают полный объект — проверить и при необходимости доработать. Опционально: аргумент или заголовок idempotencyKey для повторных запросов (возврат кэшированного результата по ключу).
- **Subscriptions:** В схеме описать подписки (например `taskCreated(boardId)`, `taskUpdated(boardId)`, `columnMoved(boardId)`). Реализация: либо graphql-ws (или аналог) с публикацией событий при соответствующих мутациях, либо заглушки (резолверы подписок возвращают async iterator с пустым или тестовым потоком, комментарий TODO). Доступ к подписке — только участники доски (проверка при subscribe).

## Вне scope

- Сложная идемпотентность (хранение по ключам дольше одной сессии). Другие транспорты кроме WebSocket для подписок.

---

## Критерии приёмки

- [ + ] MoveTask и moveColumn возвращают полную обновлённую сущность (Task/Column). updateTask при смене статуса тоже возвращает полную Task.
- [ + ] В документации/схеме описаны подписки taskCreated, taskUpdated, columnMoved по boardId.
- [ + ] Либо подписки работают (при мутации событие уходит подписчикам по boardId), либо в коде явные заглушки/TODO с пометкой «реализовать в следующей итерации».
- [ + ] При реализации подписок: проверка прав на доску при subscribe; участники доски получают события.
- [ ] Опционально: idempotencyKey в одной-двух мутациях и возврат того же результата при повторе.

---

## Проверка кода (EPIC-09)

**Реализовано:**

- **Оптимистичные ответы:** moveTask возвращает `TaskRecord` (полная задача с columnId, position); moveColumn возвращает `[Column!]!` (все колонки доски с обновлёнными position); createTask, updateTask, updateTaskLabels, updateTaskStatus, clearTaskStatusOverride возвращают полную Task. Эпик выполнен.
- **Подписки в схеме:** `subscriptions/index.ts` — базовый тип Subscription; `subscriptions/realtime.ts` — extend с `taskCreated(boardId)`, `taskUpdated(boardId)`, `columnMoved(boardId)`. Типы возврата: Task!, Task!, Column!.
- **Реализация подписок:** используется `@graphql-yoga/subscription` (createPubSub). В резолверах: `realtime.resolver.ts` — subscribe вызывает `realtimePubSub.subscribe('TASK_CREATED'|'TASK_UPDATED'|'COLUMN_MOVED', boardId)`; при мутациях вызывается `realtimePubSub.publish`: в task.resolver — TASK_CREATED после createTask, TASK_UPDATED после updateTask, moveTask, updateTaskLabels, updateTaskStatus, clearTaskStatusOverride; в column.resolver — COLUMN_MOVED после moveColumn. События уходят подписчикам по boardId.
- **Права при subscribe:** в realtime.resolver перед подпиской вызывается `assertSubscribeAccess(ctx, boardId)` — проверка currentUser и assertBoardPermission(boardId, userId, VIEWER). Доступ только у участников доски.
- **idempotencyKey:** не реализован (в эпике опционально).

---

## Ссылки

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «10. Оптимистичные сценарии», «13. Subscriptions (Realtime)».

---

## Example: как протестить схемы

Ниже минимальный ручной сценарий проверки в GraphiQL/Playground (`http://localhost:4001/graphql`).

1. Авторизуйся и возьми токен:

```graphql
mutation Login {
  login(email: "owner@example.com", password: "password123") {
    token
    user { id email }
  }
}
```

2. В headers добавь:

```json
{
  "authorization": "Bearer <TOKEN>"
}
```

3. Подпишись на события (в отдельной вкладке):

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

4. В другой вкладке выполни мутацию и проверь событие + полный объект:

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

5. Проверка `taskUpdated`:

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

И затем, в другой вкладке:

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

6. Проверка `columnMoved`:

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

И затем:

```graphql
mutation MoveColumn($id: ID!, $newPosition: Int!) {
  moveColumn(id: $id, newPosition: $newPosition) {
    id
    position
  }
}
```

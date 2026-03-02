# Sitemap: GraphQL API — запити та мутації

Усі операції API в логічному порядку: спочатку перевірка та авторизація, потім дошки, колонки, задачі, учасники, мітки, запрошення, активність; наприкінці — підписки (realtime). Для кожної операції — приклад запиту.

---

## Як працювати з API (покроково)

Для нового користувача достатньо виконати кроки по черзі: зареєструватися (або увійти), отримати токен, додати його в заголовок і далі робити запити в потрібному порядку.

### Крок 1. Реєстрація або вхід

- **Якщо немає акаунта** — викликай мутацію `register` з `email`, `password` та опційно `name`.
- **Якщо акаунт вже є** — викликай мутацію `login` з `email` та `password`.

У відповіді прийде `token` і дані `user`. Токен потрібен для всіх наступних запитів (крім публічних дошок, якщо політика це дозволяє).

**Приклад (реєстрація):**

```graphql
mutation Register {
  register(email: "user@example.com", password: "secret123", name: "Anna") {
    token
    user { id email name createdAt }
  }
}
```

**Приклад (вхід):**

```graphql
mutation Login {
  login(email: "user@example.com", password: "secret123") {
    token
    user { id email name }
  }
}
```

### Крок 2. Додати токен у заголовок

Скопіюй значення `token` з відповіді і для кожного наступного запиту додавай HTTP-заголовок:

```
Authorization: Bearer <твій_токен>
```

У GraphiQL / Apollo Playground: вкладка **HTTP HEADERS** (або **Headers**), тіло:

```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Після цього запити `me`, `boards`, `createBoard` тощо виконуються від імені авторизованого користувача.

### Крок 3. Порядок запитів

Далі викликай операції в такому порядку (за потреби):

1. **Перевірка сервера** — `health`, `version` (заголовок не обов’язковий).
2. **Поточний користувач** — `me` (потрібен заголовок з токеном).
3. **Дошки** — `boards` (список) → `board(id)` (одна дошка) → для створення/редагування: `createBoard`, `updateBoard`, `deleteBoard`.
4. **Колонки** — `columns(boardId)` → `createColumn`, `updateColumn`, `deleteColumn`, `moveColumn`.
5. **Задачі** — `task(id)`, `tasksByColumn(columnId)`, `tasksByBoard(boardId)` → `createTask`, `updateTask`, `deleteTask`, `moveTask`, `updateTaskLabels`, `updateTaskStatus`, `clearTaskStatusOverride`.
6. **Учасники дошки** — `boardMembers(boardId)` → `inviteBoardMember`, `updateBoardMemberRole`, `removeBoardMember`.
7. **Мітки та статуси** — `boardLabels(boardId)`, `boardStatuses(boardId)`, `statusById(id)` → `createLabel`, `updateLabel`, `deleteLabel`.
8. **Запрошення по email** — `pendingInvites(boardId)`, `pendingInvitesByEmail(email)` → `inviteByEmail`.
9. **Журнал активності** — `taskActivities(taskId)`, `boardActivities(boardId)`.
10. **Realtime** — підписки `taskCreated`, `taskUpdated`, `columnMoved` (WebSocket, той самий токен у з’єднанні).
11. **Вихід** — `logout` (за потреби).

Без токена в заголовку більшість мутацій і захищених запитів повернуть помилку `UNAUTHORIZED`. Публічні дошки (`visibility: PUBLIC`) можуть бути доступні для читання без авторизації — залежить від налаштувань сервера.

---

## Queries (запити)

### Службові

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `health` | — | `String!` | Перевірка доступності сервера |
| `version` | — | `String!` | Версія API |

**Приклади:**

```graphql
query Health {
  health
}

query Version {
  version
}
```

---

### Авторизація

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `me` | — | `User` | Поточний користувач (з JWT) |

**Приклад:** потрібен заголовок `Authorization: Bearer <token>`.

```graphql
query Me {
  me {
    id
    email
    name
    createdAt
  }
}
```

---

### Дошки

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `board(id)` | `id: ID!` | `Board` | Одна дошка по id |
| `boards(...)` | `sortBy`, `sortOrder`, `visibility`, `first`, `after`, `last`, `before` | `BoardConnection!` | Список дошок (з пагінацією) |

**Приклади:**

```graphql
query Board($id: ID!) {
  board(id: $id) {
    id
    title
    description
    visibility
    createdAt
    updatedAt
  }
}
# Variables: { "id": "<BOARD_ID>" }

query Boards($visibility: BoardVisibility, $first: Int) {
  boards(visibility: $visibility, first: $first) {
    edges {
      node {
        id
        title
        visibility
      }
      cursor
    }
    pageInfo {
      hasNextPage
      hasPreviousPage
      startCursor
      endCursor
    }
  }
}
# Variables: { "visibility": "PUBLIC", "first": 10 }
```

---

### Колонки

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `columns(boardId)` | `boardId: ID!` | `[Column!]!` | Колонки дошки (по position) |

**Приклад:**

```graphql
query Columns($boardId: ID!) {
  columns(boardId: $boardId) {
    id
    boardId
    title
    position
    statusId
    createdAt
  }
}
# Variables: { "boardId": "<BOARD_ID>" }
```

---

### Задачі

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `task(id)` | `id: ID!` | `Task` | Одна задача по id |
| `tasksByColumn(columnId, ...)` | `columnId: ID!`, `first`, `after`, `last`, `before` | `TaskConnection!` | Задачі колонки (з пагінацією) |
| `tasksByBoard(boardId, ...)` | `boardId: ID!`, `query`, `statusIds`, `priority`, `assigneeId`, `labelIds`, `dueFilter`, `sortBy`, `sortOrder`, `first`, `after`, `last`, `before` | `TaskConnection!` | Пошук/фільтри/сортування задач по дошці |

**Приклади:**

```graphql
query Task($id: ID!) {
  task(id: $id) {
    id
    columnId
    title
    description
    priority
    dueDate
    position
    statusId
    labelIds
    createdAt
    updatedAt
  }
}
# Variables: { "id": "<TASK_ID>" }

query TasksByColumn($columnId: ID!, $first: Int) {
  tasksByColumn(columnId: $columnId, first: $first) {
    edges {
      node {
        id
        title
        priority
        position
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
# Variables: { "columnId": "<COLUMN_ID>", "first": 20 }

query TasksByBoard(
  $boardId: ID!
  $query: String
  $statusIds: [ID!]
  $priority: [TaskPriority!]
  $sortBy: TaskSortBy
  $sortOrder: SortOrder
  $first: Int
) {
  tasksByBoard(
    boardId: $boardId
    query: $query
    statusIds: $statusIds
    priority: $priority
    sortBy: $sortBy
    sortOrder: $sortOrder
    first: $first
  ) {
    edges {
      node {
        id
        title
        columnId
        priority
        statusId
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
# Variables: { "boardId": "<BOARD_ID>", "sortBy": "CREATED_AT", "sortOrder": "DESC", "first": 50 }
```

---

### Учасники дошки

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `boardMembers(boardId)` | `boardId: ID!` | `[BoardMember!]!` | Список учасників дошки |

**Приклад:**

```graphql
query BoardMembers($boardId: ID!) {
  boardMembers(boardId: $boardId) {
    boardId
    userId
    role
    user {
      id
      email
      name
    }
  }
}
# Variables: { "boardId": "<BOARD_ID>" }
```

---

### Мітки та статуси

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `boardLabels(boardId)` | `boardId: ID!` | `[Label!]!` | Мітки дошки |
| `boardStatuses(boardId)` | `boardId: ID!` | `[Status!]!` | Статуси дошки |
| `statusById(id)` | `id: ID!` | `Status` | Статус по id |

**Приклади:**

```graphql
query BoardLabels($boardId: ID!) {
  boardLabels(boardId: $boardId) {
    id
    boardId
    name
    color
  }
}
# Variables: { "boardId": "<BOARD_ID>" }

query BoardStatuses($boardId: ID!) {
  boardStatuses(boardId: $boardId) {
    id
    boardId
    name
    order
    color
  }
}
# Variables: { "boardId": "<BOARD_ID>" }

query StatusById($id: ID!) {
  statusById(id: $id) {
    id
    name
    order
    color
  }
}
# Variables: { "id": "<STATUS_ID>" }
```

---

### Запрошення (pending invites)

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `pendingInvites(boardId)` | `boardId: ID!` | `[PendingInvite!]!` | Очікуючі запрошення по дошці |
| `pendingInvitesByEmail(email)` | `email: String!` | `[PendingInvite!]!` | Запрошення по email |

**Приклади:**

```graphql
query PendingInvites($boardId: ID!) {
  pendingInvites(boardId: $boardId) {
    id
    boardId
    email
    role
    createdAt
    invitedBy {
      id
      email
    }
  }
}
# Variables: { "boardId": "<BOARD_ID>" }

query PendingInvitesByEmail($email: String!) {
  pendingInvitesByEmail(email: $email) {
    id
    boardId
    email
    role
    board {
      id
      title
    }
  }
}
# Variables: { "email": "user@example.com" }
```

---

### Журнал активності (Activity)

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `taskActivities(taskId, ...)` | `taskId: ID!`, `first`, `after`, `last`, `before` | `ActivityConnection!` | Історія дій по задачі |
| `boardActivities(boardId, ...)` | `boardId: ID!`, `first`, `after`, `last`, `before` | `ActivityConnection!` | Історія дій по дошці |

**Приклади:**

```graphql
query TaskActivities($taskId: ID!, $first: Int) {
  taskActivities(taskId: $taskId, first: $first) {
    edges {
      node {
        id
        entityType
        entityId
        action
        diff
        createdAt
        actor {
          id
          email
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
# Variables: { "taskId": "<TASK_ID>", "first": 20 }

query BoardActivities($boardId: ID!, $first: Int) {
  boardActivities(boardId: $boardId, first: $first) {
    edges {
      node {
        id
        entityType
        entityId
        action
        diff
        createdAt
        actor {
          id
          email
        }
      }
      cursor
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
}
# Variables: { "boardId": "<BOARD_ID>", "first": 50 }
```

---

## Mutations (мутації)

### Авторизація

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `register` | `email: String!`, `password: String!`, `name: String` | `AuthPayload!` | Реєстрація; повертає token + user |
| `login` | `email: String!`, `password: String!` | `AuthPayload!` | Вхід; повертає token + user |
| `logout` | — | `Boolean!` | Вихід / інвалідація токена |

**Приклади:**

```graphql
mutation Register($email: String!, $password: String!, $name: String) {
  register(email: $email, password: $password, name: $name) {
    token
    user {
      id
      email
      name
      createdAt
    }
  }
}
# Variables: { "email": "user@example.com", "password": "secret123", "name": "John" }

mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    token
    user {
      id
      email
      name
    }
  }
}
# Variables: { "email": "user@example.com", "password": "secret123" }

mutation Logout {
  logout
}
```

---

### Дошки

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `createBoard` | `title: String!`, `description: String`, `visibility: BoardVisibility!` | `Board!` | Створити дошку |
| `updateBoard` | `id: ID!`, `title`, `description`, `visibility` | `Board!` | Оновити дошку |
| `deleteBoard` | `id: ID!` | `Boolean!` | Видалити дошку |

**Приклади:**

```graphql
mutation CreateBoard($title: String!, $description: String, $visibility: BoardVisibility!) {
  createBoard(title: $title, description: $description, visibility: $visibility) {
    id
    title
    description
    visibility
    createdAt
  }
}
# Variables: { "title": "My Board", "description": "Description", "visibility": "PRIVATE" }

mutation UpdateBoard($id: ID!, $title: String, $description: String, $visibility: BoardVisibility) {
  updateBoard(id: $id, title: $title, description: $description, visibility: $visibility) {
    id
    title
    description
    visibility
    updatedAt
  }
}
# Variables: { "id": "<BOARD_ID>", "title": "Updated Title" }

mutation DeleteBoard($id: ID!) {
  deleteBoard(id: $id)
}
# Variables: { "id": "<BOARD_ID>" }
```

---

### Колонки

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `createColumn` | `boardId: ID!`, `title: String!` | `Column!` | Створити колонку |
| `updateColumn` | `id: ID!`, `title: String!` | `Column!` | Оновити колонку |
| `deleteColumn` | `id: ID!` | `Boolean!` | Видалити колонку |
| `moveColumn` | `id: ID!`, `newPosition: Int!` | `[Column!]!` | Перемістити колонку |

**Приклади:**

```graphql
mutation CreateColumn($boardId: ID!, $title: String!) {
  createColumn(boardId: $boardId, title: $title) {
    id
    boardId
    title
    position
    statusId
  }
}
# Variables: { "boardId": "<BOARD_ID>", "title": "In Progress" }

mutation UpdateColumn($id: ID!, $title: String!) {
  updateColumn(id: $id, title: $title) {
    id
    title
    updatedAt
  }
}
# Variables: { "id": "<COLUMN_ID>", "title": "Done" }

mutation DeleteColumn($id: ID!) {
  deleteColumn(id: $id)
}
# Variables: { "id": "<COLUMN_ID>" }

mutation MoveColumn($id: ID!, $newPosition: Int!) {
  moveColumn(id: $id, newPosition: $newPosition) {
    id
    position
  }
}
# Variables: { "id": "<COLUMN_ID>", "newPosition": 0 }
```

---

### Задачі

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `createTask` | `columnId: ID!`, `title: String!`, `description`, `priority: TaskPriority!`, `dueDate`, `assigneeId` | `Task!` | Створити задачу |
| `updateTask` | `id: ID!`, `title`, `description`, `priority`, `dueDate`, `assigneeId` | `Task!` | Оновити задачу |
| `deleteTask` | `id: ID!` | `Boolean!` | Видалити задачу |
| `moveTask` | `id: ID!`, `columnId: ID!`, `position: Int` | `Task!` | Перемістити задачу в колонку/позицію |
| `updateTaskLabels` | `taskId: ID!`, `labelIds: [ID!]!` | `Task!` | Прив'язати мітки до задачі |
| `updateTaskStatus` | `taskId: ID!`, `statusId: ID!` | `Task!` | Встановити статус задачі (override) |
| `clearTaskStatusOverride` | `taskId: ID!` | `Task!` | Скинути override статусу (статус з колонки) |

**Приклади:**

```graphql
mutation CreateTask(
  $columnId: ID!
  $title: String!
  $description: String
  $priority: TaskPriority!
  $dueDate: DateTime
  $assigneeId: ID
) {
  createTask(
    columnId: $columnId
    title: $title
    description: $description
    priority: $priority
    dueDate: $dueDate
    assigneeId: $assigneeId
  ) {
    id
    columnId
    title
    description
    priority
    position
    statusId
    createdAt
  }
}
# Variables: { "columnId": "<COLUMN_ID>", "title": "New task", "priority": "MEDIUM" }

mutation UpdateTask(
  $id: ID!
  $title: String
  $description: String
  $priority: TaskPriority
  $dueDate: DateTime
  $assigneeId: ID
) {
  updateTask(
    id: $id
    title: $title
    description: $description
    priority: $priority
    dueDate: $dueDate
    assigneeId: $assigneeId
  ) {
    id
    title
    description
    priority
    updatedAt
  }
}
# Variables: { "id": "<TASK_ID>", "title": "Updated title" }

mutation DeleteTask($id: ID!) {
  deleteTask(id: $id)
}
# Variables: { "id": "<TASK_ID>" }

mutation MoveTask($id: ID!, $columnId: ID!, $position: Int) {
  moveTask(id: $id, columnId: $columnId, position: $position) {
    id
    columnId
    position
    statusId
    updatedAt
  }
}
# Variables: { "id": "<TASK_ID>", "columnId": "<COLUMN_ID>", "position": 0 }

mutation UpdateTaskLabels($taskId: ID!, $labelIds: [ID!]!) {
  updateTaskLabels(taskId: $taskId, labelIds: $labelIds) {
    id
    labelIds
    updatedAt
  }
}
# Variables: { "taskId": "<TASK_ID>", "labelIds": ["<LABEL_ID_1>", "<LABEL_ID_2>"] }

mutation UpdateTaskStatus($taskId: ID!, $statusId: ID!) {
  updateTaskStatus(taskId: $taskId, statusId: $statusId) {
    id
    statusId
    overrideStatusId
    updatedAt
  }
}
# Variables: { "taskId": "<TASK_ID>", "statusId": "<STATUS_ID>" }

mutation ClearTaskStatusOverride($taskId: ID!) {
  clearTaskStatusOverride(taskId: $taskId) {
    id
    statusId
    overrideStatusId
    updatedAt
  }
}
# Variables: { "taskId": "<TASK_ID>" }
```

---

### Учасники дошки

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `inviteBoardMember` | `boardId: ID!`, `userId: ID!`, `role: BoardRole!` | `BoardMember!` | Запросити користувача на дошку |
| `updateBoardMemberRole` | `boardId: ID!`, `userId: ID!`, `role: BoardRole!` | `BoardMember!` | Змінити роль учасника |
| `removeBoardMember` | `boardId: ID!`, `userId: ID!` | `Boolean!` | Виключити з дошки |

**Приклади:**

```graphql
mutation InviteBoardMember($boardId: ID!, $userId: ID!, $role: BoardRole!) {
  inviteBoardMember(boardId: $boardId, userId: $userId, role: $role) {
    boardId
    userId
    role
    user {
      id
      email
    }
  }
}
# Variables: { "boardId": "<BOARD_ID>", "userId": "<USER_ID>", "role": "MEMBER" }

mutation UpdateBoardMemberRole($boardId: ID!, $userId: ID!, $role: BoardRole!) {
  updateBoardMemberRole(boardId: $boardId, userId: $userId, role: $role) {
    boardId
    userId
    role
  }
}
# Variables: { "boardId": "<BOARD_ID>", "userId": "<USER_ID>", "role": "ADMIN" }

mutation RemoveBoardMember($boardId: ID!, $userId: ID!) {
  removeBoardMember(boardId: $boardId, userId: $userId)
}
# Variables: { "boardId": "<BOARD_ID>", "userId": "<USER_ID>" }
```

---

### Мітки

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `createLabel` | `boardId: ID!`, `name: String!`, `color: String` | `Label!` | Створити мітку |
| `updateLabel` | `id: ID!`, `name: String`, `color: String` | `Label!` | Оновити мітку |
| `deleteLabel` | `id: ID!` | `Boolean!` | Видалити мітку |

**Приклади:**

```graphql
mutation CreateLabel($boardId: ID!, $name: String!, $color: String) {
  createLabel(boardId: $boardId, name: $name, color: $color) {
    id
    boardId
    name
    color
  }
}
# Variables: { "boardId": "<BOARD_ID>", "name": "Bug", "color": "#DC2626" }

mutation UpdateLabel($id: ID!, $name: String, $color: String) {
  updateLabel(id: $id, name: $name, color: $color) {
    id
    name
    color
  }
}
# Variables: { "id": "<LABEL_ID>", "name": "Critical" }

mutation DeleteLabel($id: ID!) {
  deleteLabel(id: $id)
}
# Variables: { "id": "<LABEL_ID>" }
```

---

### Запрошення по email

| Операція | Аргументи | Повертає | Опис |
|----------|-----------|----------|------|
| `inviteByEmail` | `boardId: ID!`, `email: String!`, `role: BoardRole!` | `PendingInvite!` | Запросити на дошку по email |

**Приклад:**

```graphql
mutation InviteByEmail($boardId: ID!, $email: String!, $role: BoardRole!) {
  inviteByEmail(boardId: $boardId, email: $email, role: $role) {
    id
    boardId
    email
    role
    createdAt
  }
}
# Variables: { "boardId": "<BOARD_ID>", "email": "newuser@example.com", "role": "MEMBER" }
```

---

## Subscriptions (підписки, realtime)

| Подія | Аргументи | Payload | Опис |
|-------|-----------|---------|------|
| `taskCreated` | `boardId: ID!` | `Task!` | Створена задача на дошці |
| `taskUpdated` | `boardId: ID!` | `Task!` | Оновлена задача на дошці |
| `columnMoved` | `boardId: ID!` | `Column!` | Переміщена колонка на дошці |

**Приклади:** підписки працюють через WebSocket; змінна `$boardId` передається окремо.

```graphql
subscription TaskCreated($boardId: ID!) {
  taskCreated(boardId: $boardId) {
    id
    title
    columnId
    position
    createdAt
  }
}

subscription TaskUpdated($boardId: ID!) {
  taskUpdated(boardId: $boardId) {
    id
    title
    columnId
    position
    statusId
    updatedAt
  }
}

subscription ColumnMoved($boardId: ID!) {
  columnMoved(boardId: $boardId) {
    id
    boardId
    title
    position
  }
}
# Variables: { "boardId": "<BOARD_ID>" }
```

---

## Логічний порядок використання (типовий сценарій)

1. **Перевірка:** `health`, `version`
2. **Авторизація:** `register` або `login` → далі в заголовку `Authorization: Bearer <token>`
3. **Поточний користувач:** `me`
4. **Робота з дошками:** `boards` → `board(id)` → `createBoard` / `updateBoard` / `deleteBoard`
5. **Колонки:** `columns(boardId)` → `createColumn` / `updateColumn` / `deleteColumn` / `moveColumn`
6. **Задачі:** `task(id)`, `tasksByColumn`, `tasksByBoard` → `createTask` / `updateTask` / `deleteTask` / `moveTask` / `updateTaskLabels` / `updateTaskStatus` / `clearTaskStatusOverride`
7. **Учасники:** `boardMembers(boardId)` → `inviteBoardMember` / `updateBoardMemberRole` / `removeBoardMember`
8. **Мітки та статуси:** `boardLabels`, `boardStatuses`, `statusById` → `createLabel` / `updateLabel` / `deleteLabel`
9. **Запрошення по email:** `pendingInvites`, `pendingInvitesByEmail` → `inviteByEmail`
10. **Журнал:** `taskActivities`, `boardActivities`
11. **Realtime:** підписки `taskCreated`, `taskUpdated`, `columnMoved` по `boardId`
12. **Вихід:** `logout`

Детальні типи та enum’и — у схемах у `src/graphql/schema/`. Контракт помилок — у [FEATURES_AND_USE_CASES.md](./FEATURES_AND_USE_CASES.md) (Error handling).

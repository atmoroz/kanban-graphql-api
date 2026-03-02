# Epic 6.1: Permissions enforcement

**Мета:** Увімкнути перевірки прав по ролях для запитів та мутацій дошок, колонок і задач: фільтрація списку дошок, guard на читання (VIEWER), обмеження на зміну (ADMIN/OWNER), задачі — мінімум MEMBER.

---

## У scope

**Залежності:** [EPIC-06-roles-permissions.md](EPIC-06-roles-permissions.md) (BoardMember, ролі, `assertBoardPermission` вже є).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-P1 | `boards` — повертати тільки дошки, де поточний користувач учасник (фільтрація по членству). Без auth — по політиці: всі для демо або порожній список. |
| UC-P2 | `board(id)`, `columns(boardId)`, задачі (по колонці/дошці) — доступ тільки за наявності ролі на дошці (VIEWER або вище). Інакше FORBIDDEN. |
| UC-P3 | `updateBoard`, `deleteBoard` — перевірка прав: мінімум ADMIN для update, OWNER для delete (або обидва тільки OWNER — по матриці Epic 6). Без прав → FORBIDDEN. |
| UC-P4 | Мутації колонок (createColumn, updateColumn, deleteColumn, moveColumn) — потрібна роль на дошці: ADMIN або вище. |
| UC-P5 | Мутації задач (createTask, updateTask, deleteTask, moveTask) — потрібна роль на дошці: MEMBER або вище. |

**Реалізація:**

- У резолверах або сервісах: отримувати `ctx.currentUser`; для операцій по дошці — викликати `assertBoardPermission(boardId, userId, requiredRole)` (з `lib/permissions.ts`).
- Для `boards`: у `listBoards` (або в резолвері) фільтрувати по `boardMembers` — залишати тільки дошки, де є запис з `userId === currentUser.id`. Пагінація та сортування після фільтрації.
- Для `board(id)` та `columns(boardId)`: перед поверненням даних перевіряти роль на дошці ≥ VIEWER (через колонки — отримувати boardId з колонки/дошки та перевіряти).
- Для задач: по columnId отримати column → boardId → перевірка ролі ≥ MEMBER для мутацій; для читання — ≥ VIEWER.

## Поза scope

- Деталізація «Member — тільки свої задачі» (редагування/видалення тільки своїх) — можна винести в окремий крок або залишити в Epic 6.
- Зміна власника дошки, передача власності.

---

## Критерії прийняття

- [ + ] Query `boards` повертає тільки дошки, де поточний користувач учасник (за наявності auth). Політика без auth — зафіксована (всі/порожньо) та задокументована.
- [ + ] Query `board(id)` та `columns(boardId)` вимагають роль на дошці ≥ VIEWER; інакше FORBIDDEN.
- [ + ] Читання задач (task, tasksByColumn) — доступ тільки при ролі на дошці ≥ VIEWER.
- [ + ] `updateBoard` / `deleteBoard` перевіряють роль: update — мінімум ADMIN (або тільки OWNER), delete — OWNER; без прав → FORBIDDEN.
- [ + ] Мутації колонок (create, update, delete, move) вимагають роль ≥ ADMIN на дошці.
- [ + ] Мутації задач (create, update, delete, move) вимагають роль ≥ MEMBER на дошці.
- [ + ] Помилки у форматі Epic 1: FORBIDDEN з code та за можливості entity/reason.

---

## Перевірка коду (EPIC-06.1)

**Реалізовано:**

- **boards:** `listBoardsForUser(userId?)` — без auth повертає тільки PUBLIC дошки; з auth — PUBLIC + PRIVATE, де користувач учасник (`board.service.ts`). Резолвер передає `ctx.currentUser?.id`, пагінація після сортування.
- **board(id):** для PRIVATE перевірка VIEWER; для PUBLIC дошки віддаються без перевірки членства (політика: публічні доступні усім).
- **columns(boardId):** та сама логіка: PRIVATE → VIEWER, PUBLIC → без перевірки.
- **task, tasksByColumn:** по column → boardId → для PRIVATE дошки перевірка VIEWER, інакше FORBIDDEN/UNAUTHORIZED.
- **updateBoard:** `assertBoardPermission(id, userId, BoardRole.ADMIN)`.
- **deleteBoard:** `assertBoardPermission(id, userId, BoardRole.OWNER)`.
- **Колонки (create/update/delete/move):** у всіх мутаціях `assertBoardPermission(..., BoardRole.ADMIN)` (boardId з args або з column).
- **Задачі (create/update/delete/move):** у всіх мутаціях `assertBoardPermission(..., BoardRole.MEMBER)` (boardId через column).
- **FORBIDDEN:** `lib/permissions.ts` → `forbidden('Insufficient permissions')` з `extensions.code: FORBIDDEN`.

**Примітка:** При auth у списку `boards` показуються й усі PUBLIC дошки, а не тільки дошки, де користувач учасник. Епік допускає «тільки дошки, де учасник»; за потреби можна звузити до строго членських дошок.

---

## Посилання

- [EPIC-06-roles-permissions.md](EPIC-06-roles-permissions.md) — ролі, матриця прав, BoardMember.
- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — розд. 7 «Ролі та права доступу».

# Epic 6: Roles & Permissions

**Мета:** Учасники дошки (BoardMember), ролі (Owner, Admin, Member, Viewer), запрошення та виключення. Перевірка прав у резолверах перед мутаціями та при доступі до даних.

---

## У scope

**Фічі:** розд. 7 «Ролі та права доступу» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-R1 | Запросити користувача на дошку (boardId, userId, role) |
| UC-R2 | Змінити роль учасника |
| UC-R3 | Виключити з дошки |
| UC-R4 | Список учасників дошки |
| UC-R5 | Перевірка прав перед мутацією (boardId, requiredRole) → allow/deny |

**Матриця прав:** Viewer — тільки читання. Member — + створення/редагування своїх задач. Admin — + колонки, мітки, учасники (не Owner). Owner — повний доступ, видалення дошки.

- GraphQL: тип `BoardMember` (boardId, userId, role), зв'язок Board.members, User. Mutations: inviteBoardMember, updateBoardMemberRole, removeBoardMember. Query: board.members або participants(boardId).
- Мок: зберігати склад учасників по дошках (boardId, userId, role). При створенні дошки творець — Owner.
- У резолверах: перед мутацією отримувати поточного user (Epic 5) та роль на дошці; якщо прав недостатньо — FORBIDDEN. Список дошок користувача — тільки дошки, де він учасник. Доступ до дошки/колонки/задачі — тільки якщо користувач на дошці з потрібною роллю.
- Enum ролей: OWNER, ADMIN, MEMBER, VIEWER.

## Поза scope

- Зміна власника дошки (можна додати окремою мутацією). Activity log (Epic 8) використовуватиме actorId з контексту.

---

## Критерії прийняття

- [ + ] При створенні дошки поточний user стає Owner та записується в BoardMember.
- [ + ] inviteBoardMember, updateBoardMemberRole, removeBoardMember працюють; Owner не може бути видалений або понижений без передачі власності (або заборона).

Перевірки прав для запитів та мутацій дошок/колонок/задач — див. [EPIC-06.1](EPIC-06.1-permissions-enforcement.md).

---

## Перевірка коду (EPIC-06)

**Зроблено:**

- Тип `BoardMember`, enum `BoardRole` (OWNER, ADMIN, MEMBER, VIEWER), мок `board-members.ts`.
- Мутації: inviteBoardMember, updateBoardMemberRole, removeBoardMember з перевіркою прав (ADMIN для invite/remove, OWNER для зміни ролі). Заборона видалення/пониження Owner.
- Query `boardMembers(boardId)` з перевіркою VIEWER. Резолвер `BoardMember.user`.
- При створенні дошки передається `ownerId`, в BoardMember додається OWNER.
- `lib/permissions.ts`: getUserBoardRole, hasBoardPermission, assertBoardPermission (FORBIDDEN/UNAUTHORIZED).

---

## Посилання

- [EPIC-06.1-permissions-enforcement.md](EPIC-06.1-permissions-enforcement.md) — перевірки прав для boards/board/columns/tasks.
- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «7. Ролі та права доступу», «Зводна таблиця сутностей» (BoardMember). Error codes: FORBIDDEN.

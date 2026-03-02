# Epic 8: Activity Log

**Мета:** Журнал дій (аудит): запис при кожній мутації; читання історії по задачі та по дошці. Формат Activity зафіксовано в основному доку.

---

## У scope

**Фічі:** розд. 12 «Activity Log (Audit)» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-AL1 | Отримати історію задачі (taskId, cursor?, limit?) → [Activity], pageInfo |
| UC-AL2 | Отримати історію дошки (boardId, cursor?, limit?) → [Activity], pageInfo |

**Поля Activity:** actorId, entityType (TASK | COLUMN | BOARD), entityId, action (CREATE | UPDATE | MOVE | DELETE), diff?, createdAt.

- GraphQL: тип `Activity` з полями за специфікацією; зв'язок actor → User. Queries: taskActivities(taskId, cursor, limit), boardActivities(boardId, cursor, limit) з pageInfo.
- При кожній мутації (create/update/delete board, column, task; move task/column) — писати запис у лог: actorId з контексту (поточний user), entityType, entityId, action, опційно diff (короткий опис або old/new), createdAt. Мок: масив або сховище активностей у пам'яті.
- Доступ: тільки учасники дошки (для історії дошки); для історії задачі — учасники дошки, до якої належить задача. Інакше FORBIDDEN.

## Поза scope

- Зберігання diff у складному форматі (достатньо короткого тексту або ключів полів). Subscriptions (Epic 9).

---

## Критерії прийняття

- [ ] Після створення/оновлення/видалення/переміщення board/column/task у лог пишеться запис Activity з коректними полями.
- [ ] Query taskActivities(taskId) повертає записи по задачі з пагінацією (cursor, limit).
- [ ] Query boardActivities(boardId) повертає записи по дошці з пагінацією.
- [ ] Доступ до логу тільки за наявності прав на дошку; інакше FORBIDDEN.
- [ ] У відповіді Activity є actor (User) або actorId для відображення «хто зробив».

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «12. Activity Log (Audit)», «Зводна таблиця сутностей» (Activity).

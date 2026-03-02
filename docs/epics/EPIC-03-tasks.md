# Epic 3: Tasks

**Мета:** Задачі в колонках: CRUD, переміщення між колонками/позиціями, список задач по колонці. Статус можна поки прив'язати до колонки спрощено (повний маппінг — в Epic 7).

---

## У scope

**Фічі:** розд. 3 «Задачі (Tasks / Cards)» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-T1 | Створити задачу |
| UC-T2 | Оновити задачу |
| UC-T3 | Видалити задачу |
| UC-T4 | Перемістити задачу (columnId, position?) |
| UC-T5 | Отримати задачу по id |
| UC-T6 | Список задач колонки (з сортуванням, cursor, limit) |

- GraphQL: тип `Task` (id, columnId, title, description, priority, dueDate, assigneeId, position, statusId?, createdAt, updatedAt); queries task, tasksByColumn; mutations createTask, updateTask, deleteTask, moveTask.
- Мок: `data/mock/tasks.ts`, зв'язок з columns. assigneeId опційно (User поки мок або null).
- Сервіс: `task.service`. При переміщенні — оновити position у колонці; при зміні колонки — перерахунок позицій. Статус при move можна виставляти по колонці спрощено (фіксований статус на колонку або заглушка).
- Сортування списку задач колонки: по position (та за потреби sortBy — див. Epic 4, можна закласти аргументи вже тут).

## Поза scope

- Пошук/фільтри по дошці (Epic 4), мітки та статуси в повному вигляді (Epic 7), авторизація та ролі (Epic 5–6), activity log (Epic 8).

---

## Критерії прийняття

- [ + ] Query `task(id)`, `tasksByColumn(columnId, sort?, cursor?, limit?)` з pageInfo.
- [ + ] Mutations: createTask, updateTask, deleteTask, moveTask. MoveTask повертає оновлену Task (оптимістичний кейс).
- [ + ] У моку задачі прив'язані до колонок, position унікальний в межах колонки.
- [ + ] Переміщення задачі в іншу колонку/позицію коректно змінює дані в моку.
- [ + ] Помилки NOT_FOUND, за потреби VALIDATION_FAILED.

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «3. Задачі (Tasks / Cards)», «Зводна таблиця сутностей».

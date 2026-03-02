# Epic 4: Search, Filters, Sort

**Мета:** Пошук та фільтрація задач по дошці, сортування списків (задачі, дошки). Контракт cursor-based, фільтри комбінуються через AND.

---

## У scope

**Фічі:** розд. 4 «Пошук і фільтрація», розд. 5 «Сортування» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-F1 | Пошук задач по тексту (boardId, query) |
| UC-F2 | Фільтр по статусу |
| UC-F3 | Фільтр по пріоритету |
| UC-F4 | Фільтр по виконавцю |
| UC-F5 | Фільтр по мітках |
| UC-F6 | Фільтр по дедлайну (прострочено / на цьому тижні / без терміну) |
| UC-F7 | Комбіновані фільтри + сортування + пагінація |
| UC-S1 | Сортування задач (sortBy, sortOrder) |
| UC-S2 | Сортування дошок (sortBy, sortOrder) |
| UC-S3 | Колонки по position (вже є в Epic 2) |

- Один query для задач по дошці з аргументами: boardId, query?, statusIds?, priority?, assigneeId?, dueFilter?, sortBy, sortOrder, cursor, limit. Повернення: список Task + pageInfo.
- Список дошок (boards) розширити аргументами sortBy, sortOrder (name, createdAt, updatedAt).
- Мок: фільтрація та пошук в пам'яті (по title/description — substring); пріоритет — порядок critical > high > medium > low. dueFilter — опційно (overdue, this_week, no_due).

## Поза scope

- Повнотекстовий пошук в БД; складна аналітика. Ролі та доступ до дошок — в Epic 6 (тут можна віддавати всі дошки/задачі з моку).

---

## Критерії прийняття

- [ + ] Query задач по дошці з фільтрами та сортуванням, пагінація cursor-based.
- [ + ] Пошук по тексту (title, description) працює в моку.
- [ + ] Комбінація фільтрів (AND) дає очікуваний результат.
- [ + ] Сортування задач: createdAt, updatedAt, dueDate, priority, title; дошок: name, createdAt, updatedAt.
- [ + ] Список дошок підтримує sortBy/sortOrder.
- [ + ] API не віддає offset, тільки курсори та pageInfo.

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «4. Пошук і фільтрація задач», «5. Сортування».

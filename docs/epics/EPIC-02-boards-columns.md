# Epic 2: Boards & Columns

**Мета:** Реалізувати дошки та колонки: типи, мок-дані, CRUD та списки. Працюємо без авторизації (userId можна заглушити або опційно передавати).

---

## У scope

**Фічі:** розд. 1 «Дошки», розд. 2 «Колонки» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-B1 | Створити дошку |
| UC-B2 | Оновити дошку |
| UC-B3 | Видалити дошку |
| UC-B4 | Отримати дошку по id |
| UC-B5 | Список дошок (з пагінацією cursor-based) |
| UC-C1 | Створити колонку |
| UC-C2 | Оновити колонку |
| UC-C3 | Видалити колонку |
| UC-C4 | Перемістити колонку (newPosition) |
| UC-C5 | Список колонок дошки (по position) |

- GraphQL: типи `Board`, `Column`; queries (board, boards, columns по boardId); mutations (create/update/delete board, create/update/delete/move column).
- Мок у `data/mock/`: boards, columns. Зв'язок column.boardId → board.
- Сервіси: `board.service`, `column.service` (або загальний шар викликів моку).
- Правила: position колонки при створенні — в кінець; при переміщенні — перерахунок position у сусідніх. Власника дошки поки не перевіряємо (Epic 5–6).

## Поза scope

- Задачі, мітки, статуси, авторизація, ролі, activity log.

---

## Критерії прийняття


- [ + ] Board має visibility: PUBLIC | PRIVATE
- [ + ] boards query підтримує фільтрацію по visibility
- [ + ] Visibility поки не впливає на доступ (auth поза scope)
- [ + ] Query `board(id)`, `boards(cursor, limit)` з pageInfo.
- [ + ] Query `columns(boardId)` повертає колонки, відсортовані по position.
- [ + ] Mutations: createBoard, updateBoard, deleteBoard, createColumn, updateColumn, deleteColumn, moveColumn.
- [ + ] MoveColumn змінює position та порядок колонок у моку.
- [ + ] Помилки у форматі з Epic 1 (наприклад NOT_FOUND для неіснуючого id).
- [ + ] Пагінація списку дошок через cursor (мок може емулювати offset всередині).

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «1. Дошки», «2. Колонки», «Зводна таблиця сутностей».

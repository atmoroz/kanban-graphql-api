# Epic 5: Auth

**Мета:** Авторизація та користувачі: реєстрація, вхід, JWT, поточний користувач (me). Опційно — публічний доступ (демо) по API key або read-only без токена.

---

## У scope

**Фічі:** розд. 8 «Auth — авторизація та користувачі» в [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md).

**Use-cases:**

| ID | Дія |
|----|-----|
| UC-A1 | Реєстрація (email, password, name?) → User + token |
| UC-A2 | Вхід (email, password) → token |
| UC-A3 | Вихід / інвалідація токена |
| UC-A4 | Поточний користувач (Authorization header) → User або null |
| UC-A5 | Публічний доступ (демо): API key або без auth → read-only для демо-дошки |

- GraphQL: тип `User` (id, email, name, createdAt). Mutations: register, login (повертають token у полі або в розширенні); опційно logout. Query: `me` → User або null.
- Реалізація: `lib/auth.ts` — видача та верифікація JWT; паролі хешувати (bcrypt або аналог). У моку — зберігати користувачів та хеші паролів; при login перевіряти та повертати JWT.
- У резолверах: опційно отримувати поточного user з контексту (з заголовка Authorization). Поки не блокуємо мутації без auth (жорсткі перевірки прав — Epic 6).
- Публічний доступ: або статичний API key в env, що дає доступ тільки до однієї демо-дошки (read-only), або дозволити запити без токена до публічної дошки. Деталі — на смак (задокументувати в API).

## Поза scope

- Ролі та перевірка прав на дошку (Epic 6). OAuth, refresh token — за бажанням пізніше.

---

## Критерії прийняття

- [ + ] Mutation register створює користувача, повертає token (або user + token).
- [ + ] Mutation login по email/password повертає token. Невірні дані → UNAUTHORIZED.
- [ + ] Query me по заголовку Authorization повертає поточного User або null.
- [ + ] Захищені операції (якщо вирішимо перевіряти в цьому епіку) при відсутності/невалідному токені віддають UNAUTHORIZED у форматі з Epic 1.
- [ + ] Публічний доступ (демо) описаний та за потреби реалізований (read-only демо-дошка).
- [ + ] Паролі не зберігаються у відкритому вигляді.

---

## Посилання

- [FEATURES_AND_USE_CASES.md](../FEATURES_AND_USE_CASES.md) — «8. Auth — авторизація та користувачі». Error codes: UNAUTHORIZED.

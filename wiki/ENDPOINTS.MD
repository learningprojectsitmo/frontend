## 🔐 Authentication

### POST `/auth/login`

Log in with email and password.

- **Content-Type:** `application/x-www-form-urlencoded`

**Request Body Parameters:**

| Field         | Type    | Constraints          | Description     |
| ------------- | ------- | -------------------- | --------------- |
| `grant_type`  | string  | `"password"` (fixed) | Grant type      |
| `email`       | string  |                      | User email      |
| `password`    | string  | 5–64 characters      | User password   |
| `remember_me` | boolean |                      | Persist session |

**Response:**

```json
{
    "access_token": "string"
}
```

---

### POST `/auth/createacc`

First step of registration. Sends a confirmation code to the provided email.

- **Content-Type:** `application/json`

**Request Body:**

```json
{
    "email": "string",
    "password": "string (5–64 characters)"
}
```

---

### POST `/auth/register`

Second step of registration. Validates the confirmation code received via email.

- **Content-Type:** `application/json`

**Request Body:**

```json
{
    "email": "string",
    "confirmationCode": "111111" // string
}
```

---

### POST `/auth/resendcode`

Resends the confirmation code to the email.

- **Content-Type:** `application/json`

**Request Body:**

```json
{
    "email": "string"
}
```

---

### POST `/auth/addcontacts`

Third and final registration step. Saves contacts and visibility preference, then returns an access token. The user is now fully registered and authorized.

- **Content-Type:** `application/json`

**Request Body:**

```json
{
    "email": "string",
    "telegram": "@yournickname",
    "vk": "@yournickname",
    "showMyContacts": true
}
```

**Response:**

```json
{
    "access_token": "string"
}
```

---

### POST `/auth/resetemail`

Initiates password recovery. A reset link is sent to the user's email.

- **Content-Type:** `application/json`

**Request Body:**

```json
{
    "email": "string"
}
```

---

### POST `/auth/resetpassword`

Completes the password recovery process.

- **Content-Type:** `application/json`

**Request Body:**

```json
{
    "password": "string (5–64 characters)",
    "special_token": "string (e.g. UUID from the reset link)"
}
```

> **Note:** `special_token` prevents unauthorized password resets. It should be a unique token like a UUID embedded in the reset link sent to the email.

---

### POST `/auth/logout`

Logs the user out. Implementation details remain as-is.

---

## 🧩 Spaces

### `GET /app/spaces`

Retrieves the list of spaces and the user's role.

**Response Type:**

```ts
export type SpacesListResponse = {
    categories: { name: string }[];
    spaces: Space[];
    role: "root" | "admin" | "manager" | "member";
};

export type Space = {
    id: number;
    title: string;
    projectsCount: number;
    membersCount: number;
    color: string;
    category: string;
    description: string;
};
```

---

## 🔎 Search Bar Suggestions

### `GET /app/suggestions`

Fetches search suggestions based on a query string.

**Query Parameters:**

| Parameter | Type   | Description       |
| --------- | ------ | ----------------- |
| `search`  | string | Search query text |

**Response:** `string[]`

---

## 🔔 Notifications

### `GET /app/notifications`

Returns a list of user notifications.

**Response Type:**

```ts
export type NotificationType = "mention" | "request" | "join";

export interface Notification {
    id: number;
    type: NotificationType;
    name: string;
    action: string;
    project: string;
    time: string;
    avatar: string;
    read: boolean;
}
```

**Response:** `Notification[]`

---

## 📁 Recent Projects

### `GET /app/recentprojects`

Retrieves a list of recent projects.

**Response Type:**

```ts
export type Project = {
    id: number;
    tag: string;
    tagVariant:
        | "error"
        | "type"
        | "disabled"
        | "default"
        | "info"
        | "warning"
        | "success"
        | "secondary"
        | undefined;
    title: string;
    description: string;
    progressValue: number;
    dateText: string;
    tags: { text: string }[];
    membersCount: number;
    users: { name: string }[];
    archived: boolean;
};
```

**Response:** `Project[]`

## 🕓 История активности

### `GET /profile/activity`

Лента действий текущего пользователя + агрегат по дням для графика вклада.

**Query:** `page` (default 1), `limit` (default 50, max 100)

**Query:** `day` (optional, `YYYY-MM-DD`) — клик по ячейке графика. Лента
показывает только этот день, но `summary` остаётся полным, иначе график
схлопнулся бы в одну колонку. Неверная дата → `422`.

В `since` — дата регистрации пользователя.

Сетка графика фиксированной ширины: с 1-го числа месяца, на 12 месяцев раньше
текущего (сегодня — сетка с 1 сентября прошлого года, 13 подписанных месяцев).
Начинаем с границы месяца, а не «год назад от сегодня», чтобы колонки не
съезжали и месяц на подписи совпадал с первым днём сетки. Ширина не зависит от
`since` — иначе у аккаунта, которому два дня, виджет выглядит как обрывок.

`since` идёт подписью под графиком («Активность с 24.09.2026»), а дни до неё
принудительно рисуются пустыми, чтобы картинка не противоречила подписи.
Метки дней недели считаются от фактического дня начала сетки, поэтому при
другом старте они не съезжают.

**Response Type:**

```ts
export type ActivityActor = {
    id: number;
    name: string;
};

export type ActivityItem = {
    id: number;
    kind: string; // "<entity_type>:<ACTION>", например "task:UPDATE"
    description: string; // готовая фраза на русском, с именами сущностей
    performed_at: string;
    actor: ActivityActor | null; // null — системное действие
};

export type ActivityResponse = {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    since: string | null; // "YYYY-MM-DD"
    summary: { date: string; count: number }[];
    items: ActivityItem[];
};
```

### `GET /profile/{user_id}/activity`

Публичная лента активности другого пользователя. Контракт ответа идентичен
`GET /profile/activity`.

### `GET /projects/{project_id}/activity`

Лента действий всех участников проекта: метаданные, канбан (колонки, задачи,
подзадачи, исполнители), этапы, ТЗ и комментарии, отклики, участие в проекте.

Видимость повторяет `GET /projects/{project_id}`: для черновика возвращается
`404`, если запрашивающий не автор и не редактор пространства.

**Query:** `page`, `limit` — как выше.

В ответе `since` — дата **первого действия** в проекте (`min(audit_log.performed_at)`),
а не дата его создания: проект часто заводят раньше, чем начинают работать.
Если активности ещё не было — откатывается к `project.created_at`.

Рендеринг тот же, что в профиле: фиксированная сетка с 1-го числа месяца 12
месяцев назад, `since` уходит в подпись «Активность с …», дни до неё пустые.
Клик по ячейке фильтрует ленту по дню через `day`; повторный клик по тому же
дню и ссылка «Показать все дни» сбрасывают фильтр.

Вкладка «История активности» в проекте показывает график «Активность по дням»
(тот же `ContributionGraph`, что и в профиле) над лентой. `summary` считается по
всему проекту, а не по текущей странице, поэтому пагинация на график не влияет.

---

## 📄 Резюме

### `GET /workspaces/{workspace_id}/resumes`

Резюме участников пространства для карточек на странице пространства.

**Query:** `page`, `limit`, `search`, `skills[]`, `interests[]`, `default_only`

`default_only=true` оставляет только **основное** резюме каждого участника.
Страница пространства всегда передаёт этот флаг: без него `JOIN` идёт по
`author_id` и участник с N резюме получает N карточек. Диалог приглашения флаг
не передаёт — там видны все резюме.

### `PUT /resumes/{resume_id}` — `is_default`

У резюме есть признак основного, и он **ровно один на автора**.

| Действие                        | Результат                                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| Первое созданное резюме         | автоматически становится основным                                |
| `is_default: true`              | признак переносится с предыдущего основного                      |
| `is_default: false` на основном | `400` — основное снять нельзя                                    |
| `is_visible: false` на основном | признак переносится на другое видимое; если видимых нет — `400`  |
| Удаление основного              | признак переносится на другое видимое, иначе на любое оставшееся |

Инвариант «не больше одного основного на автора» обеспечен частичным уникальным
индексом `uq_resume_author_default` (`UNIQUE (author_id) WHERE is_default`), то
есть он держится даже при гонке двух запросов. Поэтому порядок операций важен:
флаг снимается **до** выставления нового, а удаление отправляется в БД до
выставления кандидату — иначе в момент записи у автора окажется два основных.

Переключение доступно в интерфейсе профиля: пункт «Сделать основным» в меню
карточки резюме, у текущего основного — бейдж «Основное».

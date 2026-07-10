
## 🔐 Authentication

### POST `/auth/login`

Log in with email and password.

- **Content-Type:** `application/x-www-form-urlencoded`

**Request Body Parameters:**

| Field        | Type    | Constraints               | Description                |
|--------------|---------|---------------------------|----------------------------|
| `grant_type` | string  | `"password"` (fixed)      | Grant type                 |
| `email`      | string  |                           | User email                 |
| `password`   | string  | 5–64 characters           | User password              |
| `remember_me`| boolean |                           | Persist session            |

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
  "confirmationCode": "111111"  // string
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

| Parameter | Type   | Description        |
|-----------|--------|--------------------|
| `search`  | string | Search query text  |

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

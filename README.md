# BulletProof App

## 📋 Обзор проекта

**BulletProof App** — это веб-приложение, построенное на современном стеке технологий с акцентом на типобезопасность, производительность и удобство разработки.

---

## 🛠 Стек технологий

### Ядро

-**React 18** + **TypeScript** — UI и типизация

-**Vite** — сборка и dev-сервер

-**ESBuild** — быстрая компиляция

### Маршрутизация

-**React Router v6** — клиентская маршрутизация

- Файл конфигурации: `src/config/paths.ts`

### Управление состоянием

-**TanStack Query (React Query)** — серверное состояние

- Конфигурация: `src/lib/react-query.ts`

### Сетевой слой

-**Axios** — HTTP-клиент

- Перехватчики (interceptors) для auth и error handling
- Файл: `src/lib/api-client.ts`

### UI и стилизация

-**Tailwind CSS** — утилитарные классы

-**shadcn/ui** — компонентная библиотека

-**Radix UI** — доступные примитивы

-**Lucide React** — иконки

### Утилиты

-**clsx** + **tailwind-merge** — управление классами

-**dayjs** — форматирование дат

---

## 📁 Структура проекта

```

src/
├── app/                    # Точка входа и маршруты
│   ├── index.tsx          # App компонент с провайдерами
│   └── routes/            # Роуты приложения
├── components/
│   ├── layouts/           # Layout компоненты
│   ├── ui/                # UI-kit (shadcn/ui)
│   └── errors/            # Error boundaries
├── config/                # Конфигурация (paths, env)
├── lib/                   # Библиотеки и утилиты
├── hooks/                 # Кастомные хуки
├── types/                 # TypeScript типы
├── utils/                 # Утилитарные функции
└── assets/                # Статические ресурсы
```

---

## 🚀 Быстрый старт

```bash

# Установка зависимостей

npm install


# Запуск dev-сервера

npm run dev


# Сборка

npm run build


# Линтинг

npm run lint
```

---

## 📚 Документация

- [Архитектура компонентов](wiki/ARCHITECTURE.md)
- [Работа с API](wiki/API.md)
- [Роутинг и навигация](wiki/ROUTING.md)
- [UI-компоненты](wiki/COMPONENTS.md)
- [Утилиты и хелперы](wiki/UTILS.md)

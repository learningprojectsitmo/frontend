![ITMO](https://raw.githubusercontent.com/aimclub/open-source-ops/43bb283758b43d75ec1df0a6bb4ae3eb20066323/badges/ITMO_badge_rus.svg)
![Docker](https://img.shields.io/badge/Docker-%232496ED?logo=docker&logoColor=white)

![Typescript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)

# Frontend of the platform for managing projects
![logo](public/eduflow.png)
## 📋 Description

A web platform for managing collaborative study projects featuring team distribution (auto/manual based on skills and interests), project management (milestones, tasks, roles, progress tracking, notifications), assessment by the teachers, and a public landing site for discovery and onboarding. 

Backend repository of the project is available [here](https://github.com/learningprojectsitmo/backend).

## 🚀 Installation

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build
npm run build

# Linting
npm run lint
```


## 🛠 Tech Stack

### Core

-**React 18** + **TypeScript** — UI and typing

-**Vite** — build and dev server

-**ESBuild** — fast compilation

### Routing

-**React Router v6** — client-side routing

- Configuration file: `src/config/paths.ts`

### State Management

-**TanStack Query (React Query)** — server state

- Configuration: `src/lib/react-query.ts`

### Network Layer

-**Axios** — HTTP client

- Interceptors for auth and error handling
- File: `src/lib/api-client.ts`

### UI and Styling

-**Tailwind CSS** — utility classes

-**shadcn/ui** — component library

-**Radix UI** — accessible primitives

-**Lucide React** — icons

### Utilities

-**clsx** + **tailwind-merge** — class management

-**dayjs** — date formatting

## Requirements
For more information, see the file **[package.json](https://github.com/learningprojectsitmo/frontend/blob/main/package.json)**.

## 📁 Project Structure

```

src/
├── app/                    # Entry point and routes
│   ├── index.tsx          # App component with providers
│   └── routes/            # Application routes
├── components/
│   ├── layouts/           # Layout components
│   ├── ui/                # UI-kit (shadcn/ui)
│   └── errors/            # Error boundaries
├── config/                # Configuration (paths, env)
├── lib/                   # Libraries and utilities
├── hooks/                 # Custom hooks
├── types/                 # TypeScript types
├── utils/                 # Utility functions
└── assets/                # Static assets

```


## 📚 Documentation

- [Component Architecture](wiki/ARCHITECTURE.md)
- [Working with API](wiki/API.md)
- [Routing and Navigation](wiki/ROUTING.md)
- [UI Components](wiki/COMPONENTS.md)
- [Utilities and Helpers](wiki/UTILS.md)

## Contacts
Our contacts:
- Afanasiev Anton, orderkworinaa@gmail.com
- Karagulov Mansur, mrkaragulov@itmo.ru

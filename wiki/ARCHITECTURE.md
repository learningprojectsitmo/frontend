# Component Architecture

## 🎯 Principles

1. **Composition** — components are built from small parts
2. **Separation of Concerns** — each component does one thing
3. **Typing** — all props are typed via TypeScript
4. **Accessibility (a11y)** — ARIA attributes and semantic markup

---

## 📁 Component Structure

```
src/components/
├── layouts/           # Layout components
│   ├── auth-layout.tsx
│   ├── spase-layout.tsx
│   └── content-layout.tsx
├── ui/                # Base UI components (shadcn/ui)
│   ├── button/
│   ├── link/
│   ├── switch/
│   ├── spinner/
│   └── notifications/
├── errors/            # Error boundaries
└── index.ts           # Exports
```

---

## 🏗 Layout Components

### AuthLayout

Used for authentication pages (login, registration).

```tsx
import { AuthLayout } from "@/components/layouts";

const LoginPage = () => {
    return (
        <AuthLayout title="Sign In">
            <Form />
        </AuthLayout>
    );
};
```

**Features:**

- Automatic redirect of authenticated users
- Background image
- Support for `redirectTo` via query parameters

### spaseLayout

Main layout for protected application pages.

```tsx
import { spaseLayout } from "@/components/layouts";

const spasePage = () => {
    return (
        <spaseLayout>
            <Content />
        </spaseLayout>
    );
};
```

---

## 🔗 Link Component

Custom component based on React Router.

```tsx
import { Link } from "@/components/ui/link";
import { paths } from "@/config/paths";

<Link to={paths.auth.login.getHref()}>Login</Link>;
```

**Props:**

- All standard `LinkProps` from React Router
- Automatic application of classes: `text-slate-600 hover:text-slate-900`

---

## 🔔 Notifications

Notification system with global state.

```tsx
import { useNotifications } from "@/components/ui/notifications";

// Adding a notification
useNotifications.getState().addNotification({
    type: "error" | "success" | "info" | "warning",
    title: "Title",
    message: "Notification message",
});
```

**Component `<Notifications />`**:

- Fixed positioning (top right corner)
- Auto-hide
- Support for multiple notifications simultaneously

---

## ⚙️ Error Boundaries

### MainErrorFallback

Component for catching critical errors.

```tsx
import { MainErrorFallback } from "@/components/errors/main";

// Usage in ErrorBoundary
<ErrorBoundary fallback={<MainErrorFallback />}>
    <App />
</ErrorBoundary>;
```

---

## 🎨 Utility Functions

### cn()

Merging CSS classes with conflict resolution.

```tsx
import { cn } from "@/utils/cn";

<div className={cn("base-class", condition && "conditional-class", className)} />;
```

**Uses:**

- `clsx` — for conditional classes
- `twMerge` — for resolving Tailwind conflicts

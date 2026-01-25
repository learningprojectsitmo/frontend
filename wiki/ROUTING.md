# Роутинг и навигация

## 🛤️ Маршруты

### Конфигурация путей

Файл: `src/config/paths.ts`

```tsx
export const paths = {
    home: {
        path: "/",
        getHref: () => "/",
    },

    auth: {
        register: {
            path: "/auth/register",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/register${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
        login: {
            path: "/auth/login",
            getHref: (redirectTo?: string | null | undefined) =>
                `/auth/login${redirectTo ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""}`,
        },
    },

    app: {
        root: {
            path: "/app",
            getHref: () => "/app",
        },
        spase: {
            path: "",
            getHref: () => "/app",
        },
    },
} as const;
```

### Использование

```tsx
import { paths } from '@/config/paths';

// Простой путь
<Link to={paths.home.getHref()} />

// С редиректом
<Link to={paths.auth.login.getHref('/app/spase')} />
// Результат: /auth/login?redirectTo=%2Fapp%2Fspase
```

---

## 🏗 Структура роутов

```
src/app/routes/
├── app/
│   └── root.tsx          # /app layout + spase
├── not-found.tsx         # 404 страница
└── index.tsx             # Редирект на /app
```

---

## 📄 Страницы

### Not Found (404)

Файл: `src/app/routes/not-found.tsx`

```tsx
import { Link } from "@/components/ui/link";
import { paths } from "@/config/paths";

const NotFoundRoute = () => {
    return (
        <div className="mt-52 flex flex-col items-center font-semibold">
            <h1>404 - Not Found</h1>
            <p>Sorry, the page you are looking for does not exist.</p>
            <Link to={paths.home.getHref()} replace>
                Go to Home
            </Link>
        </div>
    );
};
```

---

## 🔀 Навигация

### Использование Link

```tsx
import { Link } from "@/components/ui/link";

<Link to="/app/spase">Дашборд</Link>;
```

### Программная навигация

```tsx
import { useNavigate } from "react-router";

const navigate = useNavigate();

// Простой редирект
navigate("/app/spase");

// С заменой истории
navigate("/app", { replace: true });
```

---

## 🔐 Protected Routes (Защищённые роуты)

### AuthLayout

Компонент `AuthLayout` автоматически проверяет авторизацию:

```tsx
export const AuthLayout = ({ children, title }: LayoutProps) => {
    const user = useUser();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");
    const navigate = useNavigate();

    useEffect(() => {
        if (user.data) {
            navigate(redirectTo ? redirectTo : paths.app.spase.getHref(), {
                replace: true,
            });
        }
    }, [user.data, navigate, redirectTo]);

    return (
        <>
            <Head title={title} />
            <div className="...">{children}</div>
        </>
    );
};
```

### spaseLayout

```tsx
function spaseLayout({ children }: { children?: React.ReactNode }) {
    // Здесь можно добавить проверку авторизации
    // и редирект на /auth/login если не авторизован

    return <>{children}</>;
}
```

---

## 🏷 Head (Meta Tags)

Установка title страницы:

```tsx
import { Head } from "@/components/seo";

const AuthLayout = ({ children, title }: LayoutProps) => {
    return (
        <>
            <Head title={title} />
            {/* ... */}
        </>
    );
};
```

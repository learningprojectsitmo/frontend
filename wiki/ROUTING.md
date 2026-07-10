# Routing and Navigation

## 🛤️ Routes

### Path Configuration

File: `src/config/paths.ts`

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

### Usage

```tsx
import { paths } from '@/config/paths';

// Simple path
<Link to={paths.home.getHref()} />

// With redirect
<Link to={paths.auth.login.getHref('/app/spase')} />
// Result: /auth/login?redirectTo=%2Fapp%2Fspase
```

---

## 🏗 Route Structure

```
src/app/routes/
├── app/
│   └── root.tsx          # /app layout + spase
├── not-found.tsx         # 404 page
└── index.tsx             # Redirect to /app
```

---

## 📄 Pages

### Not Found (404)

File: `src/app/routes/not-found.tsx`

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

## 🔀 Navigation

### Using Link

```tsx
import { Link } from "@/components/ui/link";

<Link to="/app/spase">Dashboard</Link>;
```

### Programmatic Navigation

```tsx
import { useNavigate } from "react-router";

const navigate = useNavigate();

// Simple redirect
navigate("/app/spase");

// With history replacement
navigate("/app", { replace: true });
```

---

## 🔐 Protected Routes

### AuthLayout

The `AuthLayout` component automatically checks authentication:

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
    // You can add an authentication check here
    // and redirect to /auth/login if not authenticated

    return <>{children}</>;
}
```

---

## 🏷 Head (Meta Tags)

Setting the page title:

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

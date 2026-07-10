# UI Components

## 📦 Component Stack

- **shadcn/ui** — base components
- **Radix UI** — accessible primitives
- **Lucide React** — icons

---

## 🔘 Button

```tsx
import { Button } from "@/components/ui/button";

<Button variant="primary" size="md">
    Click me
</Button>;
```

---

## 🔗 Link

```tsx
import { Link } from "@/components/ui/link";

<Link to="/auth/login">Sign In</Link>;
```

**Default styles:** `text-slate-600 hover:text-slate-900`

---

## 🔘 Switch

Radix UI component for a toggle switch.

```tsx
import { Switch } from "@/components/ui/switch";

<Switch checked={isEnabled} onCheckedChange={setEnabled} />;
```

**CSS classes:**

- `data-[state=checked]:bg-primary` — checked state
- `data-[state=unchecked]:bg-input` — unchecked state

---

## ↻ Spinner

Loading indicator.

```tsx
import { Spinner } from "@/components/ui/spinner";

<Spinner className="size-8" />;
```

**Props:**

- All standard SVG props
- `className` — additional classes

---

## 🔔 Notifications

Notification system.

```tsx
import { useNotifications } from "@/components/ui/notifications";

// Adding
const { addNotification } = useNotifications();

addNotification({
    type: "error",
    title: "Error",
    message: "Failed to save data",
});
```

### Notification Types

```tsx
type NotificationType = "error" | "success" | "info" | "warning";
```

### Notifications Component

Placed globally (usually in App):

```tsx
import { Notifications } from "@/components/ui/notifications";

<Notifications />;
```

**Positioning:**

- `fixed inset-0` — fixed position
- `flex flex-col items-end` — top right corner
- `pointer-events-none` — doesn't block clicks

---

## 📅 Date Formatting

```tsx
import { formatDate } from "@/utils/format";

formatDate(Date.now()); // "January 25, 2026 10:30 AM"
```

**Uses:** dayjs

---

## 🎨 Style Utilities

### cn()

Merging and combining classes.

```tsx
import { cn } from "@/utils/cn";

cn(
    "px-4 py-2", // base classes
    isActive && "bg-blue", // conditional
    className, // external prop
);
// → "px-4 py-2 bg-blue"
```

**Merge order:** Tailwind classes override previous ones in case of conflict.

---

## 🎯 Best Practices

1. **Use components from `@/components/ui`** instead of native HTML tags
2. **Compose** small components into larger ones
3. **Type** props via TypeScript interfaces
4. **Follow a11y** — use ARIA attributes

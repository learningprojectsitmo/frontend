# Utilities and Helpers

## 📁 Utility Files

```
src/utils/
├── cn.ts       # CSS class merging
└── format.ts   # Data formatting
```

---

## 🎨 cn() — Class Merging

File: `src/utils/cn.ts`

```tsx
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

### Usage

```tsx
import { cn } from "@/utils/cn";

// Simple classes
cn("px-4 py-2", "bg-blue-500");
// → "px-4 py-2 bg-blue-500"

// Conditional classes
cn("base-class", condition && "active-class");
// → "base-class active-class" or "base-class"

// With className prop
<div className={cn("btn", variant === "primary" && "btn-primary", className)} />;
```

### Why twMerge?

Tailwind can produce conflicting classes with different values:

```tsx
// Conflict: both set padding
cn("p-2", "p-4");
// → "p-4" (twMerge resolves the conflict)

// clsx without twMerge keeps both
clsx("p-2", "p-4");
// → "p-2 p-4" (conflict!)
```

---

## 📅 formatDate() — Date Formatting

File: `src/utils/format.ts`

```tsx
import { default as dayjs } from "dayjs";

export const formatDate = (date: number) => dayjs(date).format("MMMM D, YYYY h:mm A");
```

### Format Tokens

| Token  | Description          |
|--------|----------------------|
| `MMMM` | Full month name      |
| `D`    | Day of the month     |
| `YYYY` | 4-digit year         |
| `h`    | Hour (12-hour clock) |
| `mm`   | Minutes              |
| `A`    | AM/PM                |

### Examples

```tsx
formatDate(1737800000000);
// → "January 25, 2026 10:30 AM"
```

### Extending dayjs

For additional functionality:

```tsx
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

dayjs("2026-01-25").fromNow();
// → "2 hours ago"
```

---

## 🧩 clsx()

Conditional CSS classes:

```tsx
import { clsx } from "clsx";

clsx("base", condition && "active");
// → "base active" or "base"

clsx("a", "b", ["c", false], { d: true });
// → "a b c d"
```

---

## 🔧 Creating New Utilities

### Template

```tsx
// src/utils/new-util.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function newUtil(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
```

### Where to Use

- Class manipulation → `cn()`
- Date formatting → `formatDate()`
- Validation → create a utility in `utils/`
- Constants → `config/`

---

## 🔤 Fonts

Font family class:

- `font-sans`

Three font weights:

- `font-normal` (400)
- `font-medium` (500)
- `font-semibold` (600)

Typography scale (font size, line-height, letter-spacing):

- `text-heading-1`: 48px, line-height: 1.2, letter-spacing: -0.02em
- `text-heading-2`: 36px
- `text-heading-3`: 30px, line-height: 1.3, letter-spacing: -0.01em
- `text-heading-4`: 24px, line-height: 1.3, letter-spacing: -0.01em
- `text-subheading`: 20px, line-height: 1.4, letter-spacing: 0
- `text-body-large`: 18px, line-height: 1.5, letter-spacing: 0
- `text-body`: 16px, line-height: 1.5, letter-spacing: 0
- `text-button-large`: 18px, line-height: 1.5, letter-spacing: 0.02em
- `text-button`: 16px, line-height: 1.5, letter-spacing: 0.02em
- `text-input`: 16px, line-height: 1.5, letter-spacing: 0
- `text-input-message`: 14px, line-height: 1.4, letter-spacing: 0
- `text-signature`: 14px, line-height: 1.4, letter-spacing: 0
- `text-signature-small`: 12px, line-height: 1.4, letter-spacing: 0
- `text-link`: 16px, line-height: 1.5, letter-spacing: 0

These can also be viewed and customized in `tailwind.config.js`.

---

## ⏱ Debounce

```tsx
import { useDebounce } from '../../utils/debounce';
const debouncedSearch = useDebounce(value, delay); // delay = 500ms
```

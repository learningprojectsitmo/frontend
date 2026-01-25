# Утилиты и хелперы

## 📁 Файлы утилит

```
src/utils/
├── cn.ts       # Объединение CSS-классов
└── format.ts   # Форматирование данных
```

---

## 🎨 cn() — объединение классов

Файл: `src/utils/cn.ts`

```tsx
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Использование

```tsx
import { cn } from '@/utils/cn';

// Простые классы
cn('px-4 py-2', 'bg-blue-500');
// → "px-4 py-2 bg-blue-500"

// Условные классы
cn('base-class', condition && 'active-class');
// → "base-class active-class" или "base-class"

// С пропсом className
<div className={cn('btn', variant === 'primary' && 'btn-primary', className)} />
```

### Почему twMerge?

Tailwind позволяет дублировать классы с разными значениями:

```tsx
// Конфликт: оба устанавливают padding
cn('p-2', 'p-4'); 
// → "p-4" (twMerge разрешает конфликт)

// clsx без twMerge оставит оба
clsx('p-2', 'p-4'); 
// → "p-2 p-4" (конфликт!)
```

---

## 📅 formatDate() — форматирование дат

Файл: `src/utils/format.ts`

```tsx
import { default as dayjs } from 'dayjs';

export const formatDate = (date: number) =>
  dayjs(date).format('MMMM D, YYYY h:mm A');
```

### Формат

| Маркер | Описание |
|--------|----------|
| `MMMM` | Полное название месяца |
| `D` | День месяца |
| `YYYY` | Год (4 цифры) |
| `h` | Час (12-часовой формат) |
| `mm` | Минуты |
| `A` | AM/PM |

### Примеры

```tsx
formatDate(1737800000000);
// → "January 25, 2026 10:30 AM"
```

### Расширение dayjs

Для дополнительных функций:

```tsx
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

dayjs('2026-01-25').fromNow();
// → "2 hours ago"
```

---

## 🧩 clsx()

Условные CSS-классы:

```tsx
import { clsx } from 'clsx';

clsx('base', condition && 'active');
// → "base active" или "base"

clsx('a', 'b', ['c', false], { d: true });
// → "a b c d"
```

---

## 🔧 Создание новых утилит

### Шаблон

```tsx
// src/utils/new-util.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function newUtil(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### Где использовать

- Манипуляции с классами → `cn()`
- Форматирование дат → `formatDate()`
- Валидация → создать утилиту в `utils/`
- Константы → `config/`

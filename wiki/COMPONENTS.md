# UI-компоненты

## 📦 Компонентный стек

- **shadcn/ui** — базовые компоненты
- **Radix UI** — доступные примитивы
- **Lucide React** — иконки

---

## 🔘 Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="primary" size="md">
  Нажми меня
</Button>
```

---

## 🔗 Link

```tsx
import { Link } from '@/components/ui/link';

<Link to="/auth/login">Войти</Link>
```

**Стили по умолчанию:** `text-slate-600 hover:text-slate-900`

---

## 🔘 Switch

Radix UI компонент для переключателя.

```tsx
import { Switch } from '@/components/ui/switch';

<Switch 
  checked={isEnabled}
  onCheckedChange={setEnabled}
/>
```

**CSS классы:**
- `data-[state=checked]:bg-primary` — включённое состояние
- `data-[state=unchecked]:bg-input` — выключенное состояние

---

## ↻ Spinner

Индикатор загрузки.

```tsx
import { Spinner } from '@/components/ui/spinner';

<Spinner className="size-8" />
```

**Props:**
- Все стандартные SVG props
- `className` — дополнительные классы

---

## 🔔 Notifications

Система уведомлений.

```tsx
import { useNotifications } from '@/components/ui/notifications';

// Добавление
const { addNotification } = useNotifications();

addNotification({
  type: 'error',
  title: 'Ошибка',
  message: 'Не удалось сохранить данные',
});
```

### Типы уведомлений

```tsx
type NotificationType = 'error' | 'success' | 'info' | 'warning';
```

### Компонент Notifications

Размещается глобально (обычно в App):

```tsx
import { Notifications } from '@/components/ui/notifications';

<Notifications />
```

**Позиционирование:**
- `fixed inset-0` — фиксированная позиция
- `flex flex-col items-end` — правый верхний угол
- `pointer-events-none` — не блокирует клики

---

## 📅 Форматирование дат

```tsx
import { formatDate } from '@/utils/format';

formatDate(Date.now()); // "January 25, 2026 10:30 AM"
```

**Использует:** dayjs

---

## 🎨 Утилиты стилей

### cn()

Объединение и мердж классов.

```tsx
import { cn } from '@/utils/cn';

cn(
  'px-4 py-2',           // базовые классы
  isActive && 'bg-blue', // условные
  className              // проп извне
);
// → "px-4 py-2 bg-blue"
```

**Порядок мерджа:** Tailwind классы перезаписывают предыдущие при конфликте.

---

## 🎯 Best Practices

1. **Используйте компоненты из `@/components/ui`** вместо нативных HTML-тегов
2. **Компонуйте** маленькие компоненты в большие
3. **Типизируйте** props через TypeScript интерфейсы
4. **Следуйте a11y** — используйте ARIA атрибуты

import type { ReactNode } from "react";

import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type AppWindowMockupProps = {
    /** Адрес в строке браузера — подчёркивает, что это страница приложения. */
    url: string;
    /** Доступное описание иллюстрации для скринридеров. */
    label: string;
    children: ReactNode;
    className?: string;
};

/**
 * Общая рамка мокапов лендинга: строка браузера и рабочая область приложения.
 * Боковое меню намеренно не показываем — мокап должен повторять саму страницу,
 * а не навигацию вокруг неё. Цвета берутся из токенов приложения, поэтому рамка
 * переключается вместе с темой лендинга.
 */
export const AppWindowMockup = ({ url, label, children, className }: AppWindowMockupProps) => (
    <div
        role="img"
        aria-label={label}
        className={cn(
            "pointer-events-none w-full select-none overflow-hidden rounded-2xl border border-gray-200 bg-app-surface shadow-xl shadow-gray-900/5",
            className,
        )}
    >
        <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
            <div className="flex shrink-0 gap-1.5">
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
                <span className="h-2 w-2 rounded-full bg-gray-300" />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-gray-200 bg-app-surface px-2.5 py-1">
                <Icon name="link" size={10} className="shrink-0 text-gray-400" />
                <span className="truncate text-[10px] text-gray-400">{url}</span>
            </div>
        </div>
        {children}
    </div>
);

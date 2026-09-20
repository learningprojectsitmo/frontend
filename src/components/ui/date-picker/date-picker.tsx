import React from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuPortal,
} from "@/components/ui/dropdown/dropdown-menu";
import { Calendar } from "./calendar";

export interface DatePickerProps {
    value: Date | null;
    onChange: (date: Date) => void;
    placeholder?: string;
    disabled?: boolean;
    align?: "start" | "end";
    className?: string;
}

const fmtDisplay = (d: Date) =>
    new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" })
        .format(d)
        .replace(/\s*г\.$/u, "");

export function DatePicker({
    value,
    onChange,
    placeholder = "Выберите дату",
    disabled = false,
    align = "start",
    className,
}: DatePickerProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button
                    type="button"
                    disabled={disabled}
                    className={cn(
                        "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors hover:bg-app-ghost disabled:pointer-events-none disabled:opacity-50",
                        !value && "text-app-muted",
                        className,
                    )}
                >
                    <span>{value ? fmtDisplay(value) : placeholder}</span>
                    <ChevronDown className="h-3.5 w-3.5 text-app-muted" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuPortal>
                <DropdownMenuContent
                    align={align}
                    className="w-auto border-app-border p-1"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Calendar selected={value} onSelect={onChange} />
                </DropdownMenuContent>
            </DropdownMenuPortal>
        </DropdownMenu>
    );
}

export function DatePickerClearButton({
    onClick,
    className,
}: {
    onClick: () => void;
    className?: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "shrink-0 rounded p-0.5 text-app-muted transition-colors hover:text-red-500",
                className,
            )}
            aria-label="Сбросить дату"
        >
            <X className="h-3.5 w-3.5" />
        </button>
    );
}

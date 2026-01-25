import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.ComponentProps<"input"> {
    error?: boolean;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, error, icon, rightIcon, ...props }, ref) => {
        return (
            <div className="relative w-full">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {icon}
                    </div>
                )}

                <input
                    type={type}
                    className={cn(
                        // Базовые стили и скругление 2xl для соответствия EduSpace
                        "flex h-12 w-full rounded-2xl border border-input bg-transparent px-4 py-2 text-base shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:bg-gray-50 md:text-sm",
                        icon && "pl-11",
                        rightIcon && "pr-11",

                        // Состояние ошибки: цвет #FB2C36
                        error && [
                            "border-[#FB2C36]", // Цвет границы
                            "bg-[#FB2C36]/5", // Очень легкий фон (5% прозрачности)
                            "text-[#FB2C36]", // Цвет текста внутри
                            "focus-visible:ring-[#FB2C36]", // Цвет кольца фокуса при ошибке
                            "placeholder:text-[#FB2C36]/60", // Цвет плейсхолдера при ошибке
                        ],

                        className,
                    )}
                    ref={ref}
                    {...props}
                />

                {rightIcon && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {rightIcon}
                    </div>
                )}
            </div>
        );
    },
);
Input.displayName = "Input";

export { Input };

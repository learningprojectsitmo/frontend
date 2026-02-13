import * as React from "react";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

export interface InputProps extends React.ComponentProps<"input"> {
    error?: boolean;
    icon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            className,
            type,
            error,
            icon,
            rightIcon,
            helperText,
            disabled,
            placeholder,
            value,
            onChange,
            onFocus,
            onBlur,
            ...props
        },
        ref,
    ) => {
        const [isFocused, setIsFocused] = React.useState(false);
        const [hasValue, setHasValue] = React.useState(!!value);

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(true);
            onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            setIsFocused(false);
            onBlur?.(e);
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            setHasValue(!!e.target.value);
            onChange?.(e);
        };

        // Определяем цвет иконки слева
        const getLeftIconColor = () => {
            if (disabled) return "text-[#99A1AF]";
            if (error) {
                if (isFocused) return "text-[#0A0A0A]";
                return "text-[#FB2C36]";
            }
            if (isFocused) return "text-[#0A0A0A]";
            return "text-[#99A1AF]";
        };

        // Определяем цвет иконки справа
        const getRightIconColor = () => {
            if (disabled) return "text-[#99A1AF]";
            return "text-[#0A0A0A]";
        };

        // Определяем цвет плейсхолдера
        const getPlaceholderColor = () => {
            if (disabled) return "placeholder:text-[#99A1AF]";
            if (error) {
                if (disabled) return "placeholder:text-[#FB2C3666]";
                return "placeholder:text-[#FB2C36]";
            }
            if (isFocused && !hasValue) return "placeholder:text-[#00000033]";
            return "placeholder:text-[#717182]";
        };

        return (
            <div className="w-full">
                {/* Контейнер для инпута и иконок */}
                <div className="relative">
                    {/* Левая иконка */}
                    {icon && (
                        <div
                            className={cn(
                                "absolute left-3 top-1/2 -translate-y-1/2 z-10",
                                getLeftIconColor(),
                            )}
                        >
                            {icon}
                        </div>
                    )}

                    {/* Инпут */}
                    <input
                        type={type}
                        disabled={disabled}
                        value={value}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={cn(
                            // Базовые стили
                            "flex h-12 w-full rounded-[12px] border bg-white px-3 py-2 text-[14px] text-[#0A0A0A] transition-all",
                            "outline-none",
                            "placeholder:text-[14px]",

                            // Border
                            "border-[#00000033]",

                            // Focus
                            "focus:border-[#155DFC] focus:shadow-[0_0_0_2px_#155DFC26]",

                            // Disabled
                            "disabled:cursor-not-allowed disabled:bg-[#00000033]",

                            // Иконки
                            icon && "pl-11",
                            rightIcon && "pr-11",

                            // Error состояния
                            error && [
                                "bg-[#FFF2F4]",
                                "border-[#FB2C36]",
                                "focus:border-[#FB2C36] focus:shadow-[0_0_0_2px_#FFE4E8]",
                                "focus:bg-white",
                            ],

                            // Error + Disabled
                            error &&
                                disabled && [
                                    "bg-[#FFF2F4]",
                                    "border-[#FB2C3633]",
                                    "focus:shadow-none focus:border-[#FB2C3633]",
                                ],

                            // Плейсхолдер
                            getPlaceholderColor(),

                            className,
                        )}
                        ref={ref}
                        aria-invalid={!!error}
                        {...props}
                    />

                    {/* Правая иконка */}
                    {rightIcon && (
                        <div
                            className={cn(
                                "absolute right-3 top-1/2 -translate-y-1/2 z-10",
                                getRightIconColor(),
                            )}
                        >
                            {rightIcon}
                        </div>
                    )}
                </div>

                {/* Подпись снизу */}
                {helperText && (
                    <div
                        className={cn(
                            "flex items-center gap-[3px] mt-2 text-[12px]",
                            error ? "text-[#FB2C36]" : "text-[#121212]",
                            disabled && "text-[#99A1AF]",
                            error && disabled && "text-[#FB2C3666]",
                        )}
                    >
                        {error && (
                            <AlertCircle
                                size={12}
                                className={cn(
                                    "shrink-0",
                                    disabled ? "text-[#FB2C3666]" : "text-[#FB2C36]",
                                )}
                            />
                        )}
                        <span>{helperText}</span>
                    </div>
                )}
            </div>
        );
    },
);

Input.displayName = "Input";

export { Input };

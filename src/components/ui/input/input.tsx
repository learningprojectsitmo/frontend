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

        // Get left icon color based on state
        const getLeftIconColor = () => {
            if (disabled) return "text-[--input-icon-default]";
            if (error) {
                if (isFocused) return "text-[--input-icon-focus]";
                return "text-[--error-text]";
            }
            if (isFocused) return "text-[--input-icon-focus]";
            return "text-[--input-icon-default]";
        };

        // Get right icon color based on state
        const getRightIconColor = () => {
            if (disabled) return "text-[--input-icon-default]";
            return "text-[--input-icon-focus]";
        };

        // Get placeholder color based on state
        const getPlaceholderColor = () => {
            // Check error + disabled combination first
            if (disabled && error) return "placeholder:text-[--error-disabled-text]";
            // Then check individual states
            if (disabled) return "placeholder:text-[--input-disabled-text]";
            if (error) return "placeholder:text-[--error-text]";
            if (isFocused && !hasValue) return "placeholder:text-[--input-placeholder-focus-empty]";
            return "placeholder:text-[--input-placeholder]";
        };

        return (
            <div className="w-full">
                {/* Container for input and icons */}
                <div className="relative">
                    {/* Left icon */}
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

                    {/* Input field */}
                    <input
                        type={type}
                        disabled={disabled}
                        value={value}
                        onChange={handleChange}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        placeholder={placeholder}
                        className={cn(
                            // Base styles
                            "flex h-12 w-full rounded-[12px] border bg-[--input-bg] px-3 py-2 text-[14px] text-[--input-text] transition-all",
                            "outline-none",
                            "placeholder:text-[14px]",

                            // Border
                            "border-[--input-border]",

                            // Focus state
                            "focus:border-[--input-focus-border] focus:shadow-[0_0_0_2px_var(--input-focus-shadow)]",

                            // Disabled state
                            "disabled:cursor-not-allowed disabled:bg-[--input-disabled-bg]",

                            // Icon padding
                            icon && "pl-11",
                            rightIcon && "pr-11",

                            // Error states
                            error && [
                                "bg-[--error-bg]",
                                "border-[--error-border]",
                                "focus:border-[--error-border] focus:shadow-[0_0_0_2px_var(--error-focus-shadow)]",
                                "focus:bg-[--input-bg]",
                            ],

                            // Error + Disabled states
                            error &&
                                disabled && [
                                    "bg-[--error-disabled-bg]",
                                    "border-[--error-disabled-border]",
                                    "focus:shadow-none focus:border-[--error-disabled-border]",
                                ],

                            // Placeholder color
                            getPlaceholderColor(),

                            className,
                        )}
                        ref={ref}
                        aria-invalid={!!error}
                        {...props}
                    />

                    {/* Right icon */}
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

                {/* Helper text below input */}
                {helperText && (
                    <div
                        className={cn(
                            "flex items-center gap-[3px] mt-2 text-[12px]",
                            error ? "text-[--error-text]" : "text-[--helper-text]",
                            disabled && "text-[--input-disabled-text]",
                            error && disabled && "text-[--error-disabled-text]",
                        )}
                    >
                        {error && (
                            <AlertCircle
                                size={12}
                                className={cn(
                                    "shrink-0",
                                    disabled
                                        ? "text-[--error-disabled-text]"
                                        : "text-[--error-text]",
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

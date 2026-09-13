import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
    error?: boolean;
    helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, helperText, ...props }, ref) => (
        <div className="flex flex-col gap-1">
            <textarea
                ref={ref}
                className={cn(
                    "w-full rounded-[12px] border border-[--input-border] bg-[--input-bg] px-4 py-3 text-[14px] text-[--input-text] outline-none transition-colors placeholder:text-[--input-placeholder]",
                    "focus:border-[--input-focus-border] focus:shadow-[0_0_0_2px_var(--input-focus-shadow)]",
                    "disabled:cursor-not-allowed disabled:bg-[--input-disabled-bg]",
                    "[-webkit-autofill]:shadow-[0_0_0_1000px_var(--input-bg)_inset] [-webkit-autofill]:[-webkit-text-fill-color:var(--input-text)] [-webkit-autofill]:transition-colors",
                    error && [
                        "bg-[--error-bg]",
                        "border-[--error-border]",
                        "focus:border-[--error-border] focus:shadow-[0_0_0_2px_var(--error-focus-shadow)]",
                        "focus:bg-[--input-bg]",
                    ],
                    className,
                )}
                aria-invalid={!!error}
                {...props}
            />
            {helperText && (
                <div
                    className={cn(
                        "flex items-center gap-[3px] mt-2 text-[12px]",
                        error ? "text-[--error-text]" : "text-[--helper-text]",
                    )}
                >
                    {error && <AlertCircle size={12} className="shrink-0 text-[--error-text]" />}
                    <span>{helperText}</span>
                </div>
            )}
        </div>
    ),
);
Textarea.displayName = "Textarea";

export { Textarea };

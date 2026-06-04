import * as React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps extends React.ComponentProps<"textarea"> {
    error?: boolean;
    helperText?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ className, error, helperText, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1">
                <textarea
                    ref={ref}
                    className={cn(
                        "w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none transition-colors placeholder:text-gray-400",
                        "focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                        className,
                    )}
                    {...props}
                />
                {helperText && (
                    <span className={cn("text-xs", error ? "text-red-500" : "text-gray-500")}>
                        {helperText}
                    </span>
                )}
            </div>
        );
    },
);
Textarea.displayName = "Textarea";

export { Textarea };

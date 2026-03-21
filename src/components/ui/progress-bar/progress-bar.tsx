import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    variant?: "default" | "compact";
    colorVariant?: "dark" | "light";
    label?: string;
    showPercentage?: boolean;
    width?: number | string;
    className?: string;
    barClassName?: string;
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
    (
        {
            value,
            variant = "default",
            colorVariant = "dark",
            label = "Progress",
            showPercentage = true,
            width,
            className,
            barClassName,
            ...props
        },
        ref,
    ) => {
        const clampedValue = Math.min(100, Math.max(0, value));

        const getBackgroundColor = () => "bg-[--blue-4-20]";

        const getFilledColor = () => {
            return colorVariant === "dark" ? "bg-[--blue-4]" : "bg-[--blue-4-20]";
        };

        const getTextColor = () => {
            return colorVariant === "dark" ? "text-[--azure-46]" : "text-[--black-50]";
        };

        if (variant === "compact") {
            return (
                <div ref={ref} className={cn("flex items-center gap-3", className)} {...props}>
                    <div
                        className={cn(
                            "h-2 rounded-full overflow-hidden",
                            getBackgroundColor(),
                            typeof width === "number" ? `w-[${width}px]` : width || "w-[100px]",
                            barClassName,
                        )}
                    >
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-300",
                                getFilledColor(),
                            )}
                            style={{ width: `${clampedValue}%` }}
                        />
                    </div>

                    {showPercentage && (
                        <span className={cn("text-[11px] font-medium", getTextColor())}>
                            {clampedValue}%
                        </span>
                    )}
                </div>
            );
        }

        return (
            <div ref={ref} className={cn("w-full", className)} {...props}>
                <div className="flex justify-between mb-1">
                    <span className={cn("text-[11px] font-medium", getTextColor())}>{label}</span>
                    {showPercentage && (
                        <span className={cn("text-[11px] font-medium", getTextColor())}>
                            {clampedValue}%
                        </span>
                    )}
                </div>

                <div
                    className={cn(
                        "h-2 w-full rounded-full overflow-hidden",
                        getBackgroundColor(),
                        barClassName,
                    )}
                >
                    <div
                        className={cn(
                            "h-full rounded-full transition-all duration-300",
                            getFilledColor(),
                        )}
                        style={{ width: `${clampedValue}%` }}
                    />
                </div>
            </div>
        );
    },
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar };

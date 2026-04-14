import * as React from "react";
import { cn } from "@/lib/utils"; // adjust import path to your project

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
    value: number;
    width?: string;
    showPercentage?: boolean;
    className?: string;
    barClassName?: string;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
    ({ value, width = "w-24", showPercentage = true, className, barClassName, ...props }, ref) => {
        const clampedValue = Math.min(100, Math.max(0, value));

        return (
            <div
                ref={ref}
                className={cn("inline-flex justify-start items-center gap-3", className)}
                {...props}
            >
                {/* Bar container */}
                <div
                    className={cn(
                        "relative h-1.5 bg-[#03021333] rounded-full overflow-hidden",
                        width,
                        barClassName,
                    )}
                >
                    {/* Filled portion */}
                    <div
                        className="h-full rounded-full bg-[#030213] transition-all duration-300"
                        style={{ width: `${clampedValue}%` }}
                    />
                </div>

                {/* Percentage label */}
                {showPercentage && (
                    <div className="text-[#6A7282] text-[13px] font-normal font-sans leading-5 tracking-tight">
                        {clampedValue}%
                    </div>
                )}
            </div>
        );
    },
);

ProgressBar.displayName = "ProgressBar";

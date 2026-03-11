import React from "react";
import { cn } from "@/lib/utils";

export type TagVariant =
    | "default"
    | "success"
    | "info"
    | "warning"
    | "secondary"
    | "error"
    | "disabled"
    | "type";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: TagVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<TagVariant, string> = {
    default: "bg-[--color-gray-100] text-[--color-black]",
    success: "bg-[#00C950] text-white",
    info: "bg-[--color-blue-primary] text-white",
    warning: "bg-[#F0B100] text-white",
    secondary: "bg-[--color-gray-500] text-white",
    error: "bg-[--color-red-error] text-white",
    disabled: "bg-[--color-gray-300] text-white",
    type: "bg-white border border-[--color-black-10] text-[--grey-4] rounded-[8px]",
};

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
    ({ variant = "default", children, className, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center",
                    "px-2 py-0.5",
                    "rounded-lg text-sm font-medium",
                    "whitespace-nowrap",
                    variantStyles[variant],
                    className,
                )}
                {...props}
            >
                {children}
            </span>
        );
    },
);

Tag.displayName = "Tag";

export default Tag;
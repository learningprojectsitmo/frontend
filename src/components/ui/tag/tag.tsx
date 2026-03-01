import React from "react";
import { cn } from "@/lib/utils";

export type TagVariant =
    | "default"
    | "success"
    | "info"
    | "warning"
    | "secondary"
    | "error"
    | "disabled";

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: TagVariant;
    children: React.ReactNode;
    className?: string;
}

const variantStyles: Record<TagVariant, string> = {
    default: "bg-[#ECEEF2] text-[#030213]",
    success: "bg-[#00C950] text-white",
    info: "bg-[#2B7FFF] text-white",
    warning: "bg-[#F0B100] text-white",
    secondary: "bg-[#6A7282] text-white",
    error: "bg-[#FB2C36] text-white",
    disabled: "bg-[#8F8F8F] text-white",
};

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
    ({ variant = "default", children, className, ...props }, ref) => {
        return (
            <span
                ref={ref}
                className={cn(
                    "inline-flex items-center justify-center",
                    "px-2 py-0.5", // padding: 2px 8px (py-0.5 = 2px, px-2 = 8px)
                    "rounded-lg", // border-radius: 8px (rounded-lg = 8px)
                    "text-sm font-medium",
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

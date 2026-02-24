import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
    "inline-flex items-center justify-center shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                // For CompoundButton - 32x32, icon 16x16, bg #3B82F6, white icon
                compound:
                    "w-8 h-8 bg-[--compound-icon-bg] rounded-[10px] [&_svg]:size-4 [&_svg]:text-white",

                // Default - 36x36, icon 20x20, white bg, hover/pressed #ECECF0, icon #0A0A0A
                default:
                    "w-9 h-9 bg-[--btn-outline-bg] rounded-[8px] [&_svg]:size-5 [&_svg]:text-[--btn-outline-text] hover:bg-[--btn-outline-hover-bg] active:bg-[--btn-outline-hover-bg]",

                // Blue variant - 36x36, icon 20x20, white bg, hover/pressed #155DFC26, icon #0A0A0A
                blue: "w-9 h-9 bg-[--btn-outline-bg] rounded-[8px] [&_svg]:size-5 [&_svg]:text-[--btn-outline-text] hover:bg-[--color-blue-15] active:bg-[--color-blue-15]",

                // Ghost - 36x36, no bg, icon 20x20, hover #ECECF0, icon #0A0A0A
                ghost: "w-9 h-9 bg-transparent rounded-[8px] [&_svg]:size-5 [&_svg]:text-[--btn-outline-text] hover:bg-[--btn-outline-hover-bg] active:bg-[--btn-outline-hover-bg]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
);

export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButtonVariants> {
    asChild?: boolean;
    icon: React.ReactNode;
    badge?: number | string;
    badgeClassName?: string;
}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
    (
        { className, variant, asChild = false, icon, badge, badgeClassName, children, ...props },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";

        const content = (
            <div className="relative">
                {icon}
                {badge !== undefined && badge !== 0 && (
                    <span
                        className={cn(
                            "absolute -top-[0.65rem] -right-[0.65rem] min-w-5 h-5 px-1",
                            "flex items-center justify-center",
                            "bg-[--badge-bg] text-white text-[12px] font-medium",
                            "rounded-[8px] border-2 border-white",
                            "shadow-sm",
                            badgeClassName,
                        )}
                    >
                        {badge}
                    </span>
                )}
            </div>
        );

        return (
            <Comp ref={ref} className={cn(iconButtonVariants({ variant, className }))} {...props}>
                {asChild ? children : content}
            </Comp>
        );
    },
);

IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
    "inline-flex items-center justify-center shrink-0 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            variant: {
                // Для CompoundButton - 32x32, иконка 16x16, фон #3B82F6, иконка белая
                compound: "w-8 h-8 bg-[#3B82F6] rounded-[10px] [&_svg]:size-4 [&_svg]:text-white",

                // Дефолтный - 36x36, иконка 20x20, белый фон, hover/pressed #ECECF0, иконка #0A0A0A
                default:
                    "w-9 h-9 bg-white rounded-[8px] [&_svg]:size-5 [&_svg]:text-[#0A0A0A] hover:bg-[#ECECF0] active:bg-[#ECECF0]",

                // Синий вариант - 36x36, иконка 20x20, белый фон, hover/pressed #155DFC26, иконка #0A0A0A
                blue: "w-9 h-9 bg-white rounded-[8px] [&_svg]:size-5 [&_svg]:text-[#0A0A0A] hover:bg-[#155DFC26] active:bg-[#155DFC26]",

                // Ghost - 36x36, без фона, иконка 20x20, hover #ECECF0, иконка #0A0A0A
                ghost: "w-9 h-9 bg-transparent rounded-[8px] [&_svg]:size-5 [&_svg]:text-[#0A0A0A] hover:bg-[#ECECF0] active:bg-[#ECECF0]",
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
                {badge !== undefined && (
                    <span
                        className={cn(
                            "absolute -top-[0.65rem] -right-[0.65rem] min-w-5 h-5 px-1",
                            "flex items-center justify-center",
                            "bg-[#D4183D] text-white text-[12px] font-medium",
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

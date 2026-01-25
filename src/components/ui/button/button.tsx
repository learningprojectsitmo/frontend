import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[12px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                // Темный вариант (Black/Dark)
                primary: "bg-[#09090B] text-white shadow-sm hover:bg-[#18181B]",
                // Синий вариант (Accent Blue)
                accent: "bg-[#2563EB] text-white shadow-sm hover:bg-[#1D4ED8]",
                // Светло-серый (Secondary)
                secondary: "bg-[#F4F4F5] text-[#18181B] hover:bg-[#E4E4E7]",
                // Контурный вариант (Outline)
                outline: "border border-[#E4E4E7] bg-transparent hover:bg-[#F4F4F5] text-[#18181B]",
                // Призрачный вариант (Ghost)
                ghost: "hover:bg-[#F4F4F5] text-[#18181B]",
                // Ссылка или минималистичный
                link: "text-[#2563EB] underline-offset-4 hover:underline px-0",
            },
            size: {
                default: "h-11 px-5 py-2", // Увеличил высоту согласно макету
                sm: "h-9 rounded-[10px] px-4 text-xs",
                lg: "h-14 rounded-[14px] px-10 text-base",
                icon: "h-11 w-11 rounded-full", // Для иконок часто используется круг
            },
        },
        defaultVariants: {
            variant: "primary",
            size: "default",
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : "button";
        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };

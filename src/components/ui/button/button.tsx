import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                dark: "bg-[--btn-dark-bg] text-[--btn-dark-text] hover:bg-[--btn-dark-hover-bg] hover:text-[--btn-dark-hover-text] active:bg-[--btn-dark-active-bg] active:text-[--btn-dark-active-text] active:border active:border-[--btn-dark-active-border]",
                outline:
                    "bg-[--btn-outline-bg] border border-[--btn-outline-border] text-[--btn-outline-text] hover:bg-[--btn-outline-hover-bg] hover:text-[--btn-outline-hover-text] active:bg-[--btn-outline-active-bg] active:text-[--btn-outline-active-text] active:border-0",
                darkTransparent:
                    "bg-[--btn-dark-transparent-bg] text-[--btn-dark-transparent-text] hover:bg-[--btn-dark-transparent-hover-bg] hover:text-[--btn-dark-transparent-hover-text] active:bg-[--btn-dark-transparent-active-bg] active:text-[--btn-dark-transparent-active-text]",
                outlineSoft:
                    "bg-[--btn-outline-soft-bg] border border-[--btn-outline-soft-border] text-[--btn-outline-soft-text] hover:bg-[--btn-outline-soft-hover-bg] hover:text-[--btn-outline-soft-hover-text] active:bg-[--btn-outline-soft-active-bg] active:text-[--btn-outline-soft-active-text] active:border-[--btn-outline-soft-active-border]",
                blue: "bg-[--btn-blue-bg] text-[--btn-blue-text] hover:bg-[--btn-blue-hover-bg] hover:text-[--btn-blue-hover-text] active:bg-[--btn-blue-active-bg] active:text-[--btn-blue-active-text]",
            },
            size: {
                fixed36: "w-[223px] h-9 rounded-[8px] px-3 py-2",
                fixed48: "w-[223px] h-12 rounded-[12px] px-4 py-3",
                hug36: "h-9 rounded-[8px] px-3 py-2",
                hug48: "h-12 rounded-[12px] px-4 py-3",
                hug56: "h-14 rounded-[14px] px-6 py-4",
                fill36: "w-full h-9 rounded-[8px] px-3 py-2",
                fill48: "w-full h-12 rounded-[12px] px-4 py-3",
                fill56: "w-full h-14 rounded-[14px] px-6 py-4",
            },
            align: {
                center: "justify-center",
                left: "justify-start",
                right: "justify-end",
            },
            hasIcon: {
                true: "gap-[10px]",
                false: "",
            },
            hasIconAsChild: {
                true: "gap-[10px]",
                false: "",
            },
        },
        compoundVariants: [
            {
                size: ["hug36", "hug48", "hug56"] as const,
                hasIcon: true,
                className: "gap-4",
            },
            {
                size: ["hug36", "hug48", "hug56"] as const,
                hasIconAsChild: true,
                className: "gap-4",
            },
            {
                size: ["fill36", "fill48", "fill56"] as const,
                hasIcon: true,
                className: "gap-4",
            },
            {
                size: ["fill36", "fill48", "fill56"] as const,
                hasIconAsChild: true,
                className: "gap-4",
            },
        ],
        defaultVariants: {
            variant: "dark",
            size: "fixed36",
            align: "center",
            hasIcon: false,
            hasIconAsChild: false,
        },
    },
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            align,
            asChild = false,
            icon,
            iconPosition = "left",
            hasIconAsChild: explicitHasIconAsChild,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";
        const hasIcon = !!icon;

        const shouldHaveIconAsChild = asChild ? (explicitHasIconAsChild ?? false) : false;

        const content = (
            <>
                {icon && iconPosition === "left" && icon}
                {children}
                {icon && iconPosition === "right" && icon}
            </>
        );

        return (
            <Comp
                className={cn(
                    buttonVariants({
                        variant,
                        size,
                        align,
                        hasIcon,
                        hasIconAsChild: shouldHaveIconAsChild,
                        className,
                    }),
                )}
                ref={ref}
                {...props}
            >
                {asChild ? children : content}
            </Comp>
        );
    },
);
Button.displayName = "Button";

export { Button, buttonVariants };

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const lineButtonVariants = cva(
    "inline-flex items-center bg-transparent px-0 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
    {
        variants: {
            width: {
                hug: "w-auto",
                fill: "w-full",
            },
            hasIcon: {
                true: "gap-2",
                false: "",
            },
        },
        defaultVariants: {
            width: "hug",
            hasIcon: false,
        },
    },
);

export interface LineButtonProps
    extends
        Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
        VariantProps<typeof lineButtonVariants> {
    asChild?: boolean;
    icon?: React.ReactNode;
    iconPosition?: "left" | "right";
    children: React.ReactNode;
}

const LineButton = React.forwardRef<HTMLButtonElement, LineButtonProps>(
    (
        { className, width, asChild = false, icon, iconPosition = "left", children, ...props },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";
        const hasIcon = !!icon;

        const content = (
            <>
                {icon && iconPosition === "left" && (
                    <span className="text-[#155DFC] group-hover:text-[#0A0A0A] group-active:text-[#0A0A0A] transition-colors">
                        {icon}
                    </span>
                )}
                <span
                    className={cn(
                        "inline-block pb-0.5",
                        "text-[#155DFC] group-hover:text-[#0A0A0A] group-active:text-[#0A0A0A]",
                        "border-b border-transparent group-hover:border-[#0A0A0A] group-active:border-[#0A0A0A]",
                        "transition-colors",
                    )}
                >
                    {children}
                </span>
                {icon && iconPosition === "right" && (
                    <span className="text-[#155DFC] group-hover:text-[#0A0A0A] group-active:text-[#0A0A0A] transition-colors">
                        {icon}
                    </span>
                )}
            </>
        );

        return (
            <Comp
                ref={ref}
                className={cn(
                    lineButtonVariants({
                        width,
                        hasIcon,
                        className,
                    }),
                    "group",
                )}
                {...props}
            >
                {asChild ? children : content}
            </Comp>
        );
    },
);

LineButton.displayName = "LineButton";

export { LineButton, lineButtonVariants };

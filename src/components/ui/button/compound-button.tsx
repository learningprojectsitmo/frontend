import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { IconButton } from "./icon-button";

const compoundButtonVariants = cva(
    "inline-flex items-center justify-start gap-3 py-[10px] px-[12px] rounded-[8px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-[--btn-outline-bg] hover:bg-[--btn-outline-hover-bg] active:bg-[--btn-outline-bg] active:border active:border-[--btn-outline-border] active:outline-none",
    {
        variants: {
            width: {
                fixed: "w-[203px]",
                fill: "w-full",
                hug: "w-auto",
            },
        },
        defaultVariants: {
            width: "fixed",
        },
    },
);

interface CompoundButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof compoundButtonVariants> {
    asChild?: boolean;
    title: string;
    subtitle: string;
    icon?: React.ReactNode;
}

const CompoundButton = React.forwardRef<HTMLButtonElement, CompoundButtonProps>(
    (
        {
            className,
            width,
            asChild = false,
            title,
            subtitle,
            icon = <Plus size={16} className="text-white" />,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";

        // Create the compound button content
        const compoundContent = (
            <>
                <IconButton variant="compound" icon={icon} />
                <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-[--btn-outline-text] leading-tight truncate">
                        {title}
                    </span>
                    <span className="text-[10px] text-[--color-gray-500] leading-tight truncate">
                        {subtitle}
                    </span>
                </div>
            </>
        );

        // Handle asChild mode - clone the child and inject our content
        if (
            asChild &&
            React.isValidElement<{ className?: string; children?: React.ReactNode }>(children)
        ) {
            return (
                <Comp
                    ref={ref}
                    className={cn(compoundButtonVariants({ width, className }))}
                    {...props}
                >
                    {React.cloneElement(children, {
                        className: cn(
                            "flex items-center justify-start gap-3 w-full",
                            children.props.className,
                        ),
                        children: compoundContent,
                    })}
                </Comp>
            );
        }

        // Regular rendering without asChild
        return (
            <Comp ref={ref} className={cn(compoundButtonVariants({ width, className }))} {...props}>
                {asChild ? children : compoundContent}
            </Comp>
        );
    },
);

CompoundButton.displayName = "CompoundButton";

export { CompoundButton, compoundButtonVariants };

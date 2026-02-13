// CompoundButton.tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { IconButton } from "@/components/ui/button/icon-button.tsx";

const compoundButtonVariants = cva(
    "inline-flex items-center justify-start gap-3 p-[10px_12px] rounded-[8px] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-white hover:bg-gray-100 active:bg-white active:border active:border-[#0000001A] active:outline-none",
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

        const content = (
            <>
                <IconButton variant="compound" icon={icon} />
                <div className="flex flex-col items-start min-w-0 flex-1">
                    <span className="text-[13px] font-medium text-[#0A0A0A] leading-tight truncate">
                        {title}
                    </span>
                    <span className="text-[10px] text-[#6A7282] leading-tight truncate">
                        {subtitle}
                    </span>
                </div>
            </>
        );

        return (
            <Comp ref={ref} className={cn(compoundButtonVariants({ width, className }))} {...props}>
                {asChild ? children : content}
            </Comp>
        );
    },
);

CompoundButton.displayName = "CompoundButton";

export { CompoundButton, compoundButtonVariants };

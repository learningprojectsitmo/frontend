import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Варианты для кнопки с плюсиком
const plusButtonVariants = cva(
    "inline-flex items-center whitespace-nowrap rounded-[8px] text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] w-[223px] [&_svg]:pointer-events-none [&_svg]:shrink-0",
    {
        variants: {
            variant: {
                dark: "bg-[#030213] text-[#FFFFFF] hover:bg-[#1A1A2E]",
                gray: "bg-[#ECECF0] text-[#0A0A0A] hover:bg-[#DCDCE0]",
                white: "bg-white text-[#0A0A0A] border border-[rgba(0,0,0,0.1)] hover:bg-[#F8F8F8]",
            },
            size: {
                sm: "h-9 min-h-[36px]",
                lg: "h-12 min-h-[48px]",
            },
            align: {
                left: "justify-start pl-5",
                center: "justify-center",
            },
        },
        defaultVariants: {
            variant: "dark",
            size: "lg",
            align: "left",
        },
    },
);

// Размеры иконок
const ICON_SIZES = {
    sm: 16,
    lg: 18,
} as const;

export interface PlusButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof plusButtonVariants> {
    asChild?: boolean;
    label?: string;
    iconSize?: number;
    showIcon?: boolean;
    fullWidth?: boolean;
    loading?: boolean;
    align?: "left" | "center";
}

const PlusButton = React.forwardRef<HTMLButtonElement, PlusButtonProps>(
    (
        {
            className,
            variant = "dark",
            size = "lg", // по умолчанию "lg"
            align = "left",
            asChild = false,
            label = "Добавить",
            iconSize,
            showIcon = true,
            fullWidth = false,
            loading = false,
            disabled,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : "button";

        // Используем значение по умолчанию, если size null или undefined
        const buttonSize = size || "lg";
        const calculatedIconSize = iconSize ?? ICON_SIZES[buttonSize];

        if (children) {
            return (
                <Comp
                    className={cn(
                        plusButtonVariants({ variant, size: buttonSize, align, className }),
                        fullWidth && "w-auto",
                        loading && "opacity-70 cursor-not-allowed",
                    )}
                    ref={ref}
                    disabled={disabled || loading}
                    {...props}
                >
                    {children}
                </Comp>
            );
        }

        return (
            <Comp
                className={cn(
                    plusButtonVariants({ variant, size: buttonSize, align, className }),
                    fullWidth && "w-auto",
                    loading && "opacity-70 cursor-not-allowed",
                )}
                ref={ref}
                disabled={disabled || loading}
                {...props}
            >
                <div
                    className={cn(
                        "flex items-center",
                        align === "center" ? "justify-center" : "justify-start",
                        "w-full",
                    )}
                >
                    {loading ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                        showIcon && <Plus size={calculatedIconSize} />
                    )}
                    {label && <span className={cn(showIcon && "ml-[10px]")}>{label}</span>}
                </div>
            </Comp>
        );
    },
);

PlusButton.displayName = "PlusButton";

export { PlusButton, plusButtonVariants };

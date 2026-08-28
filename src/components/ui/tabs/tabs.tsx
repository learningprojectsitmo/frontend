import * as React from "react";
import { cn } from "@/lib/utils";
import Icon, { type IconName } from "@/components/ui/icons";

export type TabVariant = "text" | "icon";

export interface TabItem {
    value: string;
    label?: string;
    icon?: IconName;
    iconPosition?: "left" | "right";
    disabled?: boolean;
}

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
    tabs: TabItem[];
    value: string;
    onValueChange: (value: string) => void;
    variant?: TabVariant;
    className?: string;
    tabClassName?: string;
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
    ({ tabs, value, onValueChange, variant = "text", className, tabClassName, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "inline-flex p-1 bg-[--color-gray-100] rounded-[10px]",
                    "w-full",
                    className,
                )}
                {...props}
            >
                {tabs.map((tab) => {
                    const isActive = tab.value === value;
                    const isDisabled = tab.disabled;

                    if (variant === "icon" && tab.icon) {
                        return (
                            <button
                                key={tab.value}
                                onClick={() => !isDisabled && onValueChange(tab.value)}
                                disabled={isDisabled}
                                className={cn(
                                    "flex-1 h-8 rounded-[10px] transition-all",
                                    "flex items-center justify-center",
                                    "text-[--grey-4]",
                                    "px-[6.5px]", // горизонтальные отступы 6.5px
                                    isActive && "bg-app-surface shadow-sm",
                                    isDisabled && "opacity-50 cursor-not-allowed",
                                    tabClassName,
                                )}
                            >
                                <Icon name={tab.icon} size={20} />
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.value}
                            onClick={() => !isDisabled && onValueChange(tab.value)}
                            disabled={isDisabled}
                            className={cn(
                                "flex-1 h-8 rounded-[10px] text-[13px] font-medium transition-all",
                                "flex items-center justify-center",
                                "px-1",
                                isActive && "bg-app-surface shadow-sm text-gray-900",
                                "text-gray-500 hover:text-gray-700",
                                isDisabled && "opacity-50 cursor-not-allowed",
                                tabClassName,
                            )}
                        >
                            {tab.icon && tab.iconPosition === "left" && (
                                <Icon name={tab.icon} size={16} className="mr-2" />
                            )}
                            {tab.label}
                            {tab.icon && tab.iconPosition === "right" && (
                                <Icon name={tab.icon} size={16} className="ml-2" />
                            )}
                        </button>
                    );
                })}
            </div>
        );
    },
);

Tabs.displayName = "Tabs";

export { Tabs };

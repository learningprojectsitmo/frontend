import * as React from "react";
import { cn } from "@/lib/utils";
import Icon, { type IconName } from "@/components/ui/icons";
import { Tag } from "@/components/ui/tag/tag";

export interface SpacesCardProps extends React.HTMLAttributes<HTMLDivElement> {
    iconColor?: string;
    iconName: IconName;
    tag: string;
    tagVariant?:
        | "default"
        | "success"
        | "info"
        | "warning"
        | "secondary"
        | "error"
        | "disabled"
        | "type";
    title: string;
    description: string;
    firstMetricIcon?: IconName;
    firstMetricText: string;
    secondMetricIcon?: IconName;
    secondMetricText: string;
    archived?: boolean;
    className?: string;
}

const SpacesCard = React.forwardRef<HTMLDivElement, SpacesCardProps>(
    (
        {
            iconColor = "bg-[--color-blue-secondary]",
            iconName,
            tag,
            tagVariant = "type",
            title,
            description,
            firstMetricIcon = "project",
            firstMetricText,
            secondMetricIcon = "members",
            secondMetricText,
            archived = false,
            className,
            ...props
        },
        ref,
    ) => {
        const iconSquareClass = archived ? "bg-[--grey-56]" : iconColor;

        const titleClass = archived ? "text-[#00000099]" : "text-[--grey-4]";

        const descriptionClass = archived ? "text-[#00000080]" : "text-[#4A5565]";

        const metricsClass = "text-[--azure-46]";

        return (
            <div
                ref={ref}
                className={cn(
                    "min-w-[320px] p-6 border border-[--color-black-10] rounded-[14px] bg-white",
                    "flex flex-col gap-4",
                    "transition-shadow hover:shadow-md",
                    className,
                )}
                {...props}
            >
                <div className="flex items-start justify-between">
                    {/* Квадратик 48x48 */}
                    <div
                        className={cn(
                            "w-12 h-12 rounded-lg flex items-center justify-center",
                            iconSquareClass,
                        )}
                    >
                        <Icon name={iconName} size={24} color="white" />
                    </div>
                    <Tag variant={tagVariant}>{tag}</Tag>
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className={cn("text-[17px] font-bold", titleClass)}>{title}</h3>
                    <p className={cn("text-[13px]", descriptionClass)}>{description}</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className={cn("flex items-center gap-1", metricsClass)}>
                        <Icon name={firstMetricIcon} size={16} />
                        <span className="text-[13px]">{firstMetricText}</span>
                    </div>
                    <div className={cn("flex items-center gap-1", metricsClass)}>
                        <Icon name={secondMetricIcon} size={16} />
                        <span className="text-[13px]">{secondMetricText}</span>
                    </div>
                </div>
            </div>
        );
    },
);

SpacesCard.displayName = "SpacesCard";

export { SpacesCard };

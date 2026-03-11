import * as React from "react";
import { cn } from "@/lib/utils";
import Icon from "@/components/ui/icons/icon";
import { Tag } from "@/components/ui/tag/tag";
import { ProgressBar } from "@/components/ui/progress-bar/progress-bar";
import { AvatarGroup } from "@/components/ui/avatar/avatar-group";
import { IconButton } from "@/components/ui/button/icon-button";

export interface ProjectCardProps extends React.HTMLAttributes<HTMLDivElement> {
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
    progressValue: number;
    progressColorVariant?: "dark" | "light";
    dateText: string;
    tags: Array<{
        text: string;
        variant?:
            | "default"
            | "success"
            | "info"
            | "warning"
            | "secondary"
            | "error"
            | "disabled"
            | "type";
    }>;
    membersCount: number;
    users: Array<{ src?: string; name: string }>;
    archived?: boolean;
    className?: string;
    onKebabClick?: () => void;
}

const ProjectCard = React.forwardRef<HTMLDivElement, ProjectCardProps>(
    (
        {
            tag,
            tagVariant = "info",
            title,
            description,
            progressValue,
            progressColorVariant = "dark",
            dateText,
            tags,
            membersCount,
            users,
            archived = false,
            onKebabClick,
            className,
            ...props
        },
        ref,
    ) => {
        const titleClass = archived ? "text-[#00000099]" : "text-[--grey-4]";

        const descriptionClass = archived ? "text-[#00000080]" : "text-[#4A5565]";

        const tagVariantForArchive = archived ? "disabled" : tagVariant;
        const progressVariant = archived ? "light" : progressColorVariant;

        return (
            <div
                ref={ref}
                className={cn(
                    "min-w-[320px] border border-[--color-black-10] rounded-[14px] bg-white",
                    "transition-shadow hover:shadow-md",
                    archived && "opacity-90",
                    className,
                )}
                {...props}
            >
                <div className="p-5 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <Tag variant={tagVariantForArchive}>{tag}</Tag>
                        <IconButton
                            variant="ghost"
                            icon={<Icon name="kebab" size={20} />}
                            onClick={onKebabClick}
                            className="text-[--btn-outline-text]"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <h3 className={cn("text-[17px] font-bold", titleClass)}>{title}</h3>
                        <p className={cn("text-[13px]", descriptionClass)}>{description}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <ProgressBar
                            value={progressValue}
                            colorVariant={progressVariant}
                            variant="default"
                        />

                        <div className="flex items-center gap-2">
                            <Icon name="calendar" size={16} color="#4A5565" />
                            <span className="text-[13px] text-[#4A5565]">{dateText}</span>
                        </div>
                    </div>

                    {tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                            {tags.map((t, index) => (
                                <Tag
                                    key={index}
                                    variant={archived ? "disabled" : t.variant || "default"}
                                >
                                    {t.text}
                                </Tag>
                            ))}
                        </div>
                    )}
                </div>

                <div className="px-5 py-3 bg-[--grey-98] rounded-b-[14px] border-t border-[--color-black-10]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Icon name="members" size={16} color="#6A7282" />
                            <span className="text-[13px] text-[--azure-46]">
                                {membersCount} members
                            </span>
                        </div>

                        <AvatarGroup users={users} max={3} />
                    </div>
                </div>
            </div>
        );
    },
);

ProjectCard.displayName = "ProjectCard";

export { ProjectCard };

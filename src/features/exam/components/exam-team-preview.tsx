import { Popover } from "@base-ui/react/popover";
import { Link } from "react-router";

import { paths } from "@/config/paths";
import type { ProjectListItemResponse } from "@/types/api";

type TeamPreview = Pick<
    ProjectListItemResponse,
    "id" | "participants_count" | "participants_preview"
>;

export function ExamTeamPreview({ project }: { project?: TeamPreview }) {
    if (!project || project.participants_count === 0) return null;

    const participants = project.participants_preview.slice(0, 3);
    return (
        <Popover.Root>
            <Popover.Trigger
                openOnHover
                delay={100}
                aria-label="Участники команды"
                className="flex cursor-pointer items-center"
            >
                {participants.map(({ id, full_name }, index) => (
                    <span
                        key={id}
                        className="flex size-7 items-center justify-center rounded-full border-2 border-app-surface bg-gray-200 dark:bg-app-border text-[10px] font-semibold text-gray-700 dark:text-slate-200"
                        style={{ marginLeft: index > 0 ? -8 : 0 }}
                    >
                        {full_name
                            .trim()
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                    </span>
                ))}
            </Popover.Trigger>
            <Popover.Portal>
                <Popover.Positioner
                    positionMethod="fixed"
                    sideOffset={8}
                    collisionPadding={8}
                    className="z-[500]"
                >
                    <Popover.Popup className="max-h-[var(--available-height)] w-[220px] max-w-[var(--available-width)] overflow-auto break-words rounded-xl border border-gray-200 dark:border-app-border bg-app-surface p-3 text-[12px] leading-5 text-gray-700 dark:text-slate-200 shadow-lg">
                        <Popover.Title className="font-semibold">
                            Всего участников — {project.participants_count}
                        </Popover.Title>
                        <ul className="mt-1">
                            {participants.map(({ id, full_name }) => (
                                <li key={id}>{full_name}</li>
                            ))}
                        </ul>
                        {project.participants_count > participants.length && (
                            <Link
                                to={paths.app.project.getHref(project.id)}
                                className="mt-2 inline-block font-medium text-app-blue underline-offset-4 hover:underline"
                            >
                                Показать всех
                            </Link>
                        )}
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}

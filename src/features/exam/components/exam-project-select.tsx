import type { RefObject } from "react";
import { Popover } from "@base-ui/react/popover";
import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    label: string;
    disabled?: boolean;
    container?: RefObject<HTMLDivElement>;
    search: string;
    onSearch: (value: string) => void;
    projects: readonly { id: number; name: string }[];
    selectedId?: number;
    onSelect: (id: number) => void;
};

export function ExamProjectSelect({ open, onOpenChange, label, disabled, container, search, onSearch, projects, selectedId, onSelect }: Props) {
    return (
        <Popover.Root open={open} onOpenChange={onOpenChange}>
            <Popover.Trigger render={<Button type="button" variant="outline" size="hug36" className="max-w-full justify-start" />} disabled={disabled}>
                <span className="truncate">{label}</span>
            </Popover.Trigger>
            <Popover.Portal container={container}>
                <Popover.Positioner positionMethod="fixed" align="start" sideOffset={8} collisionPadding={8} className="z-50">
                    <Popover.Popup aria-label="Выбор команды"
                        className="w-[300px] max-w-[var(--available-width)] rounded-[16px] border border-app-border bg-app-surface p-2 text-left shadow-lg">
                        <div className="relative mb-2">
                            <Search aria-hidden size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-app-muted" />
                            <input value={search} onChange={(event) => onSearch(event.target.value)} aria-label="Поиск команды"
                                placeholder="Поиск команды"
                                className="h-9 w-full rounded-[10px] border border-app-border bg-app-surface pl-8 pr-3 text-[13px] outline-none placeholder:text-app-muted focus-visible:ring-2 focus-visible:ring-ring" />
                        </div>
                        <div className="max-h-52 overflow-y-auto">
                            {projects.length === 0 ? (
                                <p className="px-3 py-4 text-center text-xs text-app-muted">
                                    {search.trim() ? "Команды не найдены" : "Нет доступных команд"}
                                </p>
                            ) : projects.map((project) => (
                                <button key={project.id} type="button"
                                    className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-[13px] hover:bg-app-ghost"
                                    onClick={() => onSelect(project.id)}>
                                    <span>{project.name}</span>
                                    {project.id === selectedId && <span className="text-[11px] text-app-muted">выбрана</span>}
                                </button>
                            ))}
                        </div>
                    </Popover.Popup>
                </Popover.Positioner>
            </Popover.Portal>
        </Popover.Root>
    );
}

import { Plus, MoreHorizontal, Share2, Upload, Archive, GraduationCapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuShortcut,
} from "@/components/ui/dropdown/dropdown-menu";
import { Icon } from "@/components/ui/icons";
import { type Space } from "@/types/api";

type SpaceHeaderProps = {
    spaceData: Space;
    isAuthor: boolean;
    canCreateProject?: boolean;
    isManager?: boolean;
    hasCreatedProject?: boolean;
    onSettingsOpen: () => void;
    onShareOpen: () => void;
    onCreateProject?: () => void;
};

export function SpaceHeader({
    spaceData,
    isAuthor,
    canCreateProject,
    isManager,
    hasCreatedProject,
    onSettingsOpen,
    onShareOpen,
    onCreateProject,
}: SpaceHeaderProps) {
    return (
        <div className="self-stretch inline-flex justify-between items-start">
            <div className="flex justify-start items-start gap-5">
                <div className="pt-1 flex justify-start items-center gap-2">
                    <div className="w-16 h-16 bg-color-azure-60 rounded-2xl flex justify-center items-center">
                        <div
                            className={`${spaceData.color} rounded-lg text-white h-16 w-16 flex items-center justify-center`}
                        >
                            <GraduationCapIcon size={32} />
                        </div>
                    </div>
                </div>
                <div className="inline-flex flex-col justify-start items-start gap-0.5">
                    <div className="self-stretch inline-flex justify-start items-center gap-3">
                        <div className="justify-center text-app-text text-[40px] font-bold font-sans leading-[1.1]">
                            {spaceData.title}
                        </div>
                        {isAuthor && (
                            <button
                                type="button"
                                onClick={onSettingsOpen}
                                data-have-badge="False"
                                data-icon-alignment="Default"
                                data-size="Default"
                                data-state="Default"
                                data-type="Main"
                                className="w-9 min-w-9 min-h-9 p-2 rounded-lg flex justify-center items-center hover:bg-gray-100 transition-colors"
                            >
                                <Icon name="settings" size={20} className="h-5 w-5" />
                            </button>
                        )}
                    </div>
                    <div className="self-stretch flex flex-col justify-start items-start">
                        <div className="justify-center text-app-muted text-base font-medium font-sans leading-7">
                            {spaceData.description}
                        </div>
                    </div>
                    <div className="inline-flex justify-start items-center gap-3">
                        <div className="flex justify-start items-center gap-1">
                            <div className="inline-flex flex-col justify-start items-start">
                                <div className="justify-center text-app-muted text-[13px] font-normal font-sans leading-5 tracking-tight">
                                    {spaceData.projectsCount} проектов
                                </div>
                            </div>
                        </div>
                        <div data-svg-wrapper className="relative">
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <circle cx="8" cy="8" r="1.5" fill="#6B7280" />
                            </svg>
                        </div>
                        <div className="flex justify-start items-center gap-1">
                            <div className="inline-flex flex-col justify-start items-start">
                                <div className="justify-center text-app-muted text-[13px] font-normal font-sans leading-5 tracking-tight">
                                    {spaceData.membersCount} участника
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-1">
                {canCreateProject && (
                    <Button
                        variant="dark"
                        size="hug36"
                        icon={<Plus size={18} />}
                        onClick={onCreateProject}
                        className="font-sans text-[13px] font-semibold gap-2 !h-11 !rounded-[12px] !px-[18px]"
                    >
                        Создать проект
                    </Button>
                )}
                {!canCreateProject && isManager && hasCreatedProject && (
                    <div className="text-app-muted text-[13px] font-normal font-sans leading-5">
                        Проект уже создан
                    </div>
                )}
                {isAuthor && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="w-9 h-9 p-2 rounded-lg flex justify-center items-center hover:bg-gray-100 transition-colors"
                            >
                                <MoreHorizontal size={18} />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[200px]">
                            <DropdownMenuItem
                                className="gap-3 text-sm cursor-pointer"
                                onSelect={onShareOpen}
                            >
                                <Share2 size={16} />
                                Поделись
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 text-sm cursor-pointer" disabled>
                                <Upload size={16} />
                                Экспортировать
                                <DropdownMenuShortcut>Скоро</DropdownMenuShortcut>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 text-sm cursor-pointer" disabled>
                                <Archive size={16} />
                                Архивировать
                                <DropdownMenuShortcut>Скоро</DropdownMenuShortcut>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}

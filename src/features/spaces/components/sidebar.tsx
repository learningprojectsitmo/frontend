import { useState } from "react";
import { NavLink, Link } from "react-router";
import { paths } from "@/config/paths";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { DropdownMenuSeparator } from "@/components/ui/dropdown/dropdown-menu";
import { GraduationCapIcon, Plus, PanelLeftClose, PanelLeftOpen, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreateSpaceModal } from "./create-space-modal";

type Space = {
    id: number;
    title: string;
    projectsCount: number;
    color: string;
};

type Category = {
    name: string;
    spaces: Space[];
};

type SidebarProps = {
    isCollapsed: boolean;
    onToggle: () => void;
    activeCategories: Category[];
    urlId: string | null;
    role?: string;
    isLoading?: boolean;
    isNotFound?: boolean; // ← новый проп для 404
};

// ── Skeleton expanded ──
function SidebarSkeleton() {
    return (
        <div className="p-3 flex flex-col gap-5 flex-1">
            {[1, 2].map((g) => (
                <div key={g}>
                    <div className="h-3 w-20 rounded bg-gray-100 animate-pulse mb-3" />
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-3 px-2 py-2 mb-1">
                            <div className="h-8 w-8 rounded-[10px] bg-gray-100 animate-pulse shrink-0" />
                            <div className="flex flex-col gap-1.5 flex-1">
                                <div className="h-2.5 rounded bg-gray-100 animate-pulse w-3/4" />
                                <div className="h-2 rounded bg-gray-100 animate-pulse w-1/2" />
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

// ── Skeleton collapsed ──
function SidebarSkeletonCollapsed() {
    return (
        <div className="p-2 flex flex-col gap-2 items-center">
            <div className="h-8 w-8 rounded-[10px] bg-gray-100 animate-pulse" />
            <div className="w-5 h-px bg-gray-200 my-1" />
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-8 w-8 rounded-[10px] bg-gray-100 animate-pulse" />
            ))}
        </div>
    );
}

// ── 404 заглушка в expanded-режиме ──
function SidebarNotFound() {
    return (
        <div className="flex-1 flex items-start justify-center p-4 pt-6">
            <div className="text-center text-gray-400">
                <SearchX size={32} className="mx-auto mb-2 opacity-40" />
                <p className="text-[12px] font-medium text-gray-500 leading-tight">
                    Страница не найдена
                </p>
                <p className="text-[11px] text-gray-400 mt-1 leading-tight">
                    Пространство не существует
                </p>
            </div>
        </div>
    );
}

// ── 404 заглушка в collapsed-режиме ──
function SidebarNotFoundCollapsed() {
    return (
        <div className="p-2 flex flex-col gap-1 items-center pt-3">
            <div
                className="shrink-0 h-8 w-8 rounded-[10px] bg-gray-100 flex items-center justify-center text-gray-400"
                title="Страница не найдена"
            >
                <SearchX size={15} />
            </div>
        </div>
    );
}

export function Sidebar({
    isCollapsed,
    onToggle,
    activeCategories,
    urlId,
    role,
    isLoading,
    isNotFound,
}: SidebarProps) {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const hasNoCategories = activeCategories.every((cat) => cat.spaces.length === 0);

    return (
        <>
            <CreateSpaceModal open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen} />
            <aside
                className={cn(
                    "bg-white border-r border-gray-200 flex flex-col fixed top-16 left-0 bottom-0 z-[9] transition-all duration-200 overflow-hidden",
                    isCollapsed ? "w-[56px]" : "w-[248px]",
                )}
            >
                {/* ── Кнопка «Все пространства» + кнопка сворачивания ── */}
                <div
                    className={cn(
                        "flex items-center w-full px-2 py-2",
                        isCollapsed ? "justify-center" : "gap-1",
                    )}
                >
                    {!isCollapsed && (
                        <NavLink to={paths.app.spaces.getHref()} end className="w-full">
                            {({ isActive }) => (
                                <Button
                                    variant={isActive ? "dark" : "outline"}
                                    size="fill36"
                                    align="left"
                                    hasIconAsChild={true}
                                    className="text-[13px] font-semibold w-full"
                                >
                                    <span className="flex items-center gap-2 w-full px-3">
                                        <Icon name="home" size={16} />
                                        Все пространства
                                    </span>
                                </Button>
                            )}
                        </NavLink>
                    )}

                    <Button
                        variant="outline"
                        size="hug36"
                        hasIconAsChild={true}
                        onClick={onToggle}
                        aria-label={isCollapsed ? "Развернуть меню" : "Свернуть меню"}
                        className="shrink-0"
                    >
                        {isCollapsed ? <PanelLeftOpen size={10} /> : <PanelLeftClose size={16} />}
                    </Button>
                </div>

                <DropdownMenuSeparator className="bg-gray-200 my-0" />

                {/* ── Основной контент ── */}
                {isLoading ? (
                    // 1. Загрузка
                    isCollapsed ? (
                        <SidebarSkeletonCollapsed />
                    ) : (
                        <SidebarSkeleton />
                    )
                ) : isNotFound ? (
                    // 2. 404 — ресурс не найден
                    isCollapsed ? (
                        <SidebarNotFoundCollapsed />
                    ) : (
                        <SidebarNotFound />
                    )
                ) : hasNoCategories && !isCollapsed ? (
                    // 3. Пустое состояние — данные есть, пространств нет
                    <div className="flex-1 flex items-center justify-center p-4">
                        <div className="text-center text-gray-400">
                            <GraduationCapIcon size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-sm">Нет доступных пространств</p>
                        </div>
                    </div>
                ) : (
                    // 4. Навигация
                    <nav className="flex flex-col grow min-h-0 overflow-y-auto overflow-x-hidden">
                        {isCollapsed ? (
                            /* ── Collapsed ── */
                            <div className="p-2 flex flex-col gap-1 items-center">
                                <NavLink
                                    to={paths.app.spaces.getHref()}
                                    title="Все пространства"
                                    end
                                    className={({ isActive }) =>
                                        cn(
                                            "shrink-0 h-8 w-8 rounded-[10px] flex items-center justify-center transition-all duration-150",
                                            isActive
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700",
                                        )
                                    }
                                >
                                    <Icon name="home" size={16} />
                                </NavLink>

                                <div className="w-5 h-px bg-gray-200 my-1" />

                                {activeCategories.map((category, index) => (
                                    <div
                                        key={category.name}
                                        className="flex flex-col gap-2 items-center w-full"
                                    >
                                        {category.spaces.map((space) => {
                                            const isActive = urlId === String(space.id);
                                            return (
                                                <Link
                                                    key={space.id}
                                                    to={paths.app.space.getHref(space.id)}
                                                    title={space.title}
                                                    className={cn(
                                                        "shrink-0 h-8 w-8 rounded-[10px] flex items-center justify-center text-white transition-all duration-150",
                                                        space.color,
                                                        isActive
                                                            ? "ring-2 ring-offset-1 ring-gray-400"
                                                            : "hover:opacity-90 hover:scale-105",
                                                    )}
                                                >
                                                    <GraduationCapIcon size={15} />
                                                </Link>
                                            );
                                        })}

                                        {category.spaces.length === 0 && (
                                            <div className="shrink-0 h-8 w-8 rounded-[10px] bg-blue-500 flex items-center justify-center text-white">
                                                <Plus size={15} />
                                            </div>
                                        )}

                                        {index < activeCategories.length - 1 && (
                                            <div className="w-5 h-px bg-gray-200 my-1" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* ── Expanded ── */
                            <div className="p-3 flex flex-col gap-5 flex-1">
                                {activeCategories.map((category) => (
                                    <div key={category.name}>
                                        <p className="px-1 mb-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                                            {category.name}
                                        </p>

                                        {category.spaces.length > 0 ? (
                                            <ul className="space-y-0.5">
                                                {category.spaces.map((space) => {
                                                    const isActive = urlId === String(space.id);
                                                    return (
                                                        <li key={space.id}>
                                                            <Link
                                                                to={paths.app.space.getHref(
                                                                    space.id,
                                                                )}
                                                                className={cn(
                                                                    "flex items-center gap-3 w-full px-2 py-2 rounded-[12px] transition-all duration-150 group",
                                                                    isActive
                                                                        ? "bg-white shadow-sm border border-gray-200"
                                                                        : "hover:bg-white hover:shadow-sm hover:border-gray-200 border border-transparent",
                                                                )}
                                                            >
                                                                <div
                                                                    className={cn(
                                                                        "shrink-0 h-8 w-8 rounded-[10px] flex items-center justify-center text-white",
                                                                        space.color,
                                                                    )}
                                                                >
                                                                    <GraduationCapIcon size={15} />
                                                                </div>
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="text-[13px] font-semibold text-gray-800 truncate leading-tight">
                                                                        {space.title}
                                                                    </span>
                                                                    <span className="text-[11px] text-gray-400 font-medium leading-tight">
                                                                        {space.projectsCount}{" "}
                                                                        проектов
                                                                    </span>
                                                                </div>
                                                            </Link>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <div className="text-[12px] text-gray-400 px-1 mb-1">
                                                Здесь будут ваши пространства
                                            </div>
                                        )}

                                        {category.spaces.length === 0 && (
                                            <button className="flex items-center gap-3 w-full px-2 py-2 rounded-[12px] border border-dashed border-gray-200 hover:border-blue-300 transition-colors group">
                                                <div className="shrink-0 h-8 w-8 rounded-[10px] bg-blue-500 flex items-center justify-center text-white">
                                                    <Plus size={15} />
                                                </div>
                                                <div className="flex flex-col min-w-0 text-left">
                                                    <span className="text-[13px] font-semibold text-gray-700">
                                                        Создать пространство
                                                    </span>
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        Нет проектов
                                                    </span>
                                                </div>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </nav>
                )}

                {/* ── Footer — скрыт при загрузке и 404 ── */}
                {!isLoading && !isNotFound && role !== "manager" && role !== "member" && (
                    <div className="border-t border-gray-200 p-3 flex-none">
                        {isCollapsed ? (
                            <Button
                                variant="outlineSoft"
                                size="fixed36"
                                hasIconAsChild={true}
                                aria-label="Создать пространство"
                                className="w-full"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                <Icon name="plus" size={16} />
                            </Button>
                        ) : (
                            <Button
                                variant="outlineSoft"
                                size="fixed36"
                                icon={<Icon name="plus" size={16} />}
                                className="w-full text-[13px] font-semibold justify-start"
                                onClick={() => setIsCreateModalOpen(true)}
                            >
                                Создать пространство
                            </Button>
                        )}
                    </div>
                )}
            </aside>
        </>
    );
}

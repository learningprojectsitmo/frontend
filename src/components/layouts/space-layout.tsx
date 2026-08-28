import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Outlet, useSearchParams, Link } from "react-router";

import { paths } from "@/config/paths";
import { useSpacesList, getSuggestions } from "@/lib/spaces";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/utils/debounce";
import { Icon } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { SearchBar } from "@/components/ui/search-bar";
import { Sidebar } from "@/features/spaces/components/sidebar";
import { UserNav } from "@/features/spaces/components/user-nav";
import { NotificationsNav } from "@/features/spaces/components/notifications";

function SpaceLayoutSkeleton() {
    return (
        <div className="flex flex-col min-h-screen bg-app-background">
            <header className="h-[72px] bg-app-surface border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-4 sm:gap-12">
                    <span
                        className="text-[30px] font-bold text-app-text"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        EduFlow
                    </span>
                </div>
            </header>
            <div className="flex-1 flex mt-[72px]">
                <aside className="w-[260px] md:w-[56px] bg-app-surface border-r border-app-border fixed top-[72px] left-0 bottom-0 z-[9]">
                    <div className="flex items-center gap-1 px-2 py-2">
                        <div className="h-9 flex-1 rounded-[10px] bg-gray-100 animate-pulse hidden md:block" />
                        <div className="h-9 w-9 rounded-[10px] bg-gray-100 animate-pulse shrink-0" />
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="p-3 flex flex-col gap-4">
                        {[1, 2].map((g) => (
                            <div key={g}>
                                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse mb-3 hidden md:block" />
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3 px-2 py-2 mb-1">
                                        <div className="h-8 w-8 rounded-[10px] bg-gray-100 animate-pulse shrink-0" />
                                        <div className="hidden md:block flex-col gap-1 flex-1">
                                            <div className="h-3 rounded bg-gray-100 animate-pulse w-4/5" />
                                            <div className="h-2 rounded bg-gray-100 animate-pulse w-2/5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 ml-[260px] md:ml-[56px] flex items-center justify-center p-8">
                    <div className="w-full max-w-4xl space-y-6">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-32 rounded-xl bg-gray-100 animate-pulse" />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}

function SpaceLayoutError() {
    return (
        <div className="flex flex-col min-h-screen bg-app-background">
            <header className="h-[72px] bg-app-surface border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-4 sm:gap-12">
                    <span
                        className="text-[30px] font-bold text-app-text"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        EduFlow
                    </span>
                </div>
            </header>
            <div className="flex-1 flex items-center justify-center mt-16">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-gray-800 mb-2">
                        Ошибка загрузки данных
                    </h1>
                    <p className="text-gray-500 mb-4">Не удалось загрузить список пространств</p>
                    <Button
                        variant="outlineSoft"
                        size="hug36"
                        onClick={() => window.location.reload()}
                    >
                        Попробовать снова
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SpaceLayoutNotFound() {
    return (
        <div className="flex flex-col min-h-screen bg-app-background">
            <header className="h-[72px] bg-app-surface border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-10">
                <div className="flex items-center gap-4 sm:gap-12">
                    <span
                        className="text-[30px] font-bold text-app-text"
                        style={{ fontFamily: "Inter, sans-serif" }}
                    >
                        EduFlow
                    </span>
                    <div className="relative">
                        <SearchBar
                            placeholder="Ищите проекты, пространства или участников..."
                            onChange={() => {}}
                            suggestions={[]}
                            value=""
                            className="w-auto sm:w-[280px] lg:w-[420px] !h-11 !rounded-full !bg-gray-100 !border-none"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        to={paths.app.ideas.getHref()}
                        className="w-9 h-9 bg-transparent rounded-[8px] flex items-center justify-center hover:bg-[--btn-outline-hover-bg] transition-colors"
                    >
                        <Icon name="lightbulb" size={20} className="text-[--btn-outline-text]" />
                    </Link>
                    <NotificationsNav />
                    <UserNav />
                </div>
            </header>
            <div className="flex-1 flex mt-[72px]">
                <aside className="w-[260px] md:w-[56px] bg-app-surface border-r border-app-border fixed top-[72px] left-0 bottom-0 z-[9]">
                    <div className="flex items-center gap-1 px-2 py-2">
                        <div className="h-9 flex-1 rounded-[10px] bg-gray-100 animate-pulse hidden md:block" />
                        <div className="h-9 w-9 rounded-[10px] bg-gray-100 animate-pulse shrink-0" />
                    </div>
                    <div className="h-px bg-gray-200" />
                    <div className="p-3 flex flex-col gap-4">
                        {[1, 2].map((g) => (
                            <div key={g}>
                                <div className="h-3 w-24 rounded bg-gray-100 animate-pulse mb-3 hidden md:block" />
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-3 px-2 py-2 mb-1">
                                        <div className="h-8 w-8 rounded-[10px] bg-gray-100 animate-pulse shrink-0" />
                                        <div className="hidden md:block flex-col gap-1 flex-1">
                                            <div className="h-3 rounded bg-gray-100 animate-pulse w-4/5" />
                                            <div className="h-2 rounded bg-gray-100 animate-pulse w-2/5" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 ml-[260px] md:ml-[56px] flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="flex justify-center mb-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center">
                                    <svg
                                        width="64"
                                        height="64"
                                        viewBox="0 0 64 64"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="opacity-40"
                                    >
                                        <circle cx="32" cy="32" r="32" fill="#F3F4F6" />
                                        <text
                                            x="50%"
                                            y="54%"
                                            dominantBaseline="middle"
                                            textAnchor="middle"
                                            fontSize="32"
                                        >
                                            🔍
                                        </text>
                                    </svg>
                                </div>
                                <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
                                    <span className="text-red-400 text-[13px] font-bold leading-none">
                                        404
                                    </span>
                                </div>
                            </div>
                        </div>
                        <h1 className="text-xl font-semibold text-gray-800 mb-2">
                            Страница не найдена
                        </h1>
                        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                            Запрошенное пространство не существует или было удалено. Проверьте
                            ссылку или вернитесь на главную страницу.
                        </p>
                        <div className="flex items-center justify-center gap-3">
                            <Button
                                variant="outlineSoft"
                                size="hug36"
                                onClick={() => window.history.back()}
                            >
                                ← Назад
                            </Button>
                            <Button
                                variant="dark"
                                size="hug36"
                                onClick={() => (window.location.href = paths.app.spaces.getHref())}
                            >
                                Все пространства
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

const SpaceLayoutHeader = React.memo(function SpaceLayoutHeader({
    search,
    onSearchChange,
    suggestions,
}: {
    search: string;
    onSearchChange: (v: string) => void;
    suggestions: string[];
}) {
    return (
        <header className="h-[72px] bg-app-surface border-b border-gray-200 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-10">
            <div className="flex items-center gap-12">
                <span
                    className="text-[30px] font-bold text-app-text"
                    style={{ fontFamily: "Inter, sans-serif" }}
                >
                    EduFlow
                </span>
                <div className="relative">
                    <SearchBar
                        placeholder="Ищите проекты, пространства или участников..."
                        onChange={onSearchChange}
                        suggestions={suggestions}
                        value={search}
                        className="w-auto sm:w-[280px] lg:w-[420px] !h-11 !rounded-full !bg-gray-100 !border-none"
                    />
                </div>
            </div>
            <div className="flex items-center gap-3">
                <Link
                    to={paths.app.ideas.getHref()}
                    className="w-9 h-9 bg-transparent rounded-[8px] flex items-center justify-center hover:bg-[--btn-outline-hover-bg] transition-colors"
                >
                    <Icon name="lightbulb" size={20} className="text-[--btn-outline-text]" />
                </Link>
                <NotificationsNav />
                <UserNav />
            </div>
        </header>
    );
});

function SpaceLayoutMain({ isCollapsed }: { isCollapsed: boolean }) {
    return (
        <main
            className={cn(
                "flex-1 overflow-y-auto transition-all duration-200",
                isCollapsed ? "ml-[56px]" : "ml-[260px]",
            )}
        >
            <Outlet />
        </main>
    );
}

function SpaceLayoutContent({
    data,
}: {
    data: NonNullable<ReturnType<typeof useSpacesList>["data"]>;
}) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const userPreferenceRef = useRef(false);
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id");

    useEffect(() => {
        const mql = window.matchMedia("(max-width: 768px)");

        const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
            if (e.matches) {
                setIsCollapsed(true);
            } else {
                setIsCollapsed(userPreferenceRef.current);
            }
        };

        handleChange(mql);
        mql.addEventListener("change", handleChange);
        return () => mql.removeEventListener("change", handleChange);
    }, []);

    const categories = useMemo(() => {
        return data.categories.map((cat) => ({
            name: cat.name,
            spaces: data.spaces.filter((space) => space.category === cat.name),
        }));
    }, [data]);

    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search);
    const [suggestions, setSuggestions] = useState<string[]>([
        "Mobile App",
        "Mobile App Learning",
        "Mobile App X",
        "Web Development",
        "UI/UX Design",
    ]);

    useEffect(() => {
        if (!debouncedSearch) return;
        getSuggestions(debouncedSearch).then(setSuggestions);
    }, [debouncedSearch]);

    const handleToggle = useCallback(() => {
        setIsCollapsed((prev) => {
            const next = !prev;
            userPreferenceRef.current = next;
            return next;
        });
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-app-background">
            <SpaceLayoutHeader
                search={search}
                onSearchChange={setSearch}
                suggestions={suggestions}
            />
            <div className="flex-1 flex flex-row mt-16">
                <Sidebar
                    isCollapsed={isCollapsed}
                    onToggle={handleToggle}
                    activeCategories={categories}
                    urlId={urlId}
                    role={data?.role}
                />
                <SpaceLayoutMain isCollapsed={isCollapsed} />
            </div>
        </div>
    );
}

export function SpaceLayout() {
    const { data, error, isLoading } = useSpacesList({ page: 1, limit: 10 });

    if (isLoading) return <SpaceLayoutSkeleton />;
    if (error) return <SpaceLayoutError />;
    if (!data) return <SpaceLayoutNotFound />;

    return <SpaceLayoutContent data={data} />;
}

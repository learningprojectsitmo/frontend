import { Link } from "react-router";
import { paths } from "@/config/paths";
import type { SearchResults } from "@/types/search";
import { ArrowRight, Search, Loader2 } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
    in_progress: "В работе",
    review: "На проверке",
    planned: "Запланирован",
    completed: "Выполнен",
    archived: "Архив",
};

const statusStyles: Record<string, { bg: string; text: string }> = {
    in_progress: { bg: "var(--status-inprogress-bg)", text: "var(--status-inprogress-text)" },
    review: { bg: "var(--status-review-bg)", text: "var(--status-review-text)" },
    planned: { bg: "var(--status-planned-bg)", text: "var(--status-planned-text)" },
    completed: { bg: "var(--status-completed-bg)", text: "var(--status-completed-text)" },
    archived: { bg: "var(--status-draft-bg)", text: "var(--status-draft-text)" },
};

const fullName = (u: SearchResults["users"][number]) =>
    [u.last_name, u.first_name, u.middle_name].filter(Boolean).join(" ") || "—";

export function SearchResultsPanel({
    query,
    results,
    isLoading = false,
    showHeader = true,
    moreHref,
}: {
    query: string;
    results?: SearchResults;
    isLoading?: boolean;
    showHeader?: boolean;
    moreHref?: string;
}) {
    const projects = results?.projects ?? [];
    const spaces = results?.spaces ?? [];
    const users = results?.users ?? [];
    const hasResults = projects.length > 0 || spaces.length > 0 || users.length > 0;
    const isEmpty = !isLoading && !hasResults;

    return (
        <div className="flex flex-col gap-10">
            {showHeader && (
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                    <h2 className="text-lg font-semibold text-app-text">
                        {isLoading && !hasResults ? (
                            <span className="inline-flex items-center gap-2">
                                <Loader2 size={16} className="animate-spin text-app-muted" />
                                Ищем…
                            </span>
                        ) : (
                            <>Результаты поиска «{query}»</>
                        )}
                    </h2>
                </div>
            )}

            {isEmpty ? (
                <div className="rounded-xl border border-app-border bg-app-surface p-12 text-center">
                    <Search size={20} className="mx-auto mb-3 text-app-muted" />
                    <p className="text-[15px] text-app-text">Ничего не найдено</p>
                    <p className="mt-1 text-[13px] text-app-muted">
                        Попробуйте изменить запрос или ввести больше символов.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-10">
                    {projects.length > 0 && (
                        <div>
                            <h3 className="mb-3 text-[15px] font-semibold text-app-text">
                                Проекты
                            </h3>
                            <div className="bg-app-surface rounded-[20px] border border-app-border divide-y divide-app-border-light overflow-hidden">
                                {projects.map((p) => {
                                    const style = p.status ? statusStyles[p.status] : undefined;
                                    const label = p.status ? STATUS_LABELS[p.status] : undefined;
                                    return (
                                        <Link
                                            key={p.id}
                                            to={paths.app.project.getHref(p.id)}
                                            className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-app-ghost"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2.5">
                                                    {label && style && (
                                                        <span
                                                            className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium leading-none shrink-0"
                                                            style={{
                                                                backgroundColor: style.bg,
                                                                color: style.text,
                                                            }}
                                                        >
                                                            {label}
                                                        </span>
                                                    )}
                                                    <span className="truncate text-[14px] font-medium text-app-text group-hover:text-[#2563EB] transition-colors">
                                                        {p.name}
                                                    </span>
                                                </div>
                                                {p.description && (
                                                    <p className="mt-1 truncate text-[13px] text-app-muted">
                                                        {p.description}
                                                    </p>
                                                )}
                                            </div>
                                            {p.workspace_name && (
                                                <span className="shrink-0 text-[12px] font-medium text-app-muted">
                                                    {p.workspace_name}
                                                </span>
                                            )}
                                            <div className="flex w-[120px] shrink-0 items-center gap-3">
                                                <div className="h-1.5 flex-1 bg-app-ghost rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full bg-app-text transition-all duration-300"
                                                        style={{
                                                            width: `${Math.min(100, Math.max(0, p.progress))}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="text-[12px] font-medium text-app-muted tabular-nums">
                                                    {p.progress}%
                                                </span>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {spaces.length > 0 && (
                        <div>
                            <h3 className="mb-3 text-[15px] font-semibold text-app-text">
                                Пространства
                            </h3>
                            <div className="bg-app-surface rounded-[20px] border border-app-border divide-y divide-app-border-light overflow-hidden">
                                {spaces.map((s) => (
                                    <Link
                                        key={s.id}
                                        to={paths.app.space.getHref(s.id)}
                                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-app-ghost"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <span className="truncate text-[14px] font-medium text-app-text group-hover:text-[#2563EB] transition-colors">
                                                {s.title}
                                            </span>
                                            {s.description && (
                                                <p className="mt-1 truncate text-[13px] text-app-muted">
                                                    {s.description}
                                                </p>
                                            )}
                                        </div>
                                        {s.category && (
                                            <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full bg-app-ghost text-[12px] font-medium text-app-muted leading-none">
                                                {s.category}
                                            </span>
                                        )}
                                        <span className="shrink-0 text-[12px] text-app-muted">
                                            {s.projects_count} проектов · {s.members_count}{" "}
                                            участников
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {users.length > 0 && (
                        <div>
                            <h3 className="mb-3 text-[15px] font-semibold text-app-text">
                                Участники
                            </h3>
                            <div className="bg-app-surface rounded-[20px] border border-app-border divide-y divide-app-border-light overflow-hidden">
                                {users.map((u) => (
                                    <Link
                                        key={u.id}
                                        to={paths.app.profile.getHref(u.id)}
                                        className="group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-app-ghost"
                                    >
                                        <span className="min-w-0 truncate text-[14px] font-medium text-app-text group-hover:text-[#2563EB] transition-colors">
                                            {fullName(u)}
                                        </span>
                                        <span className="ml-auto shrink-0 text-[12px] text-app-muted">
                                            {u.email ?? "—"}
                                        </span>
                                        {u.role && (
                                            <span className="shrink-0 inline-flex items-center h-6 px-2.5 rounded-full bg-app-ghost text-[12px] font-medium text-app-muted leading-none">
                                                {u.role}
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}

                    {moreHref && (
                        <div className="flex justify-center">
                            <Link
                                to={moreHref}
                                className="inline-flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
                            >
                                Подробнее — расширенный поиск
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

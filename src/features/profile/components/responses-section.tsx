import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useResponses } from "@/features/profile/api/use-profile-data";
import { ListToolbar } from "./list-toolbar";
import { EmptyState } from "./empty-state";
import { ResponsesFilters } from "./filters/responses-filters";
import { defaultProfileFilters, type ProfileFiltersState } from "@/types/profile";
import { ResponseCard, type ResponseCardAction } from "./response-card";
import { api } from "@/lib/api-client";
import { queryKeys } from "@/lib/query-keys";
import { invalidateProjectImpact } from "@/lib/projects";

const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: "На рассмотрении", color: "#D97706", bg: "#FEF3C7" },
    accepted: { text: "Принят", color: "#16A34A", bg: "#DCFCE7" },
    rejected: { text: "Отклонён", color: "#EF4444", bg: "#FEE2E2" },
    withdrawn: { text: "Отозван", color: "#6B7280", bg: "#F3F4F6" },
};

export function ResponsesSection() {
    const queryClient = useQueryClient();
    const { data: responses, isLoading } = useResponses();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<ProfileFiltersState>(defaultProfileFilters);
    const [pendingWithdraw, setPendingWithdraw] = useState<number | null>(null);

    const items = useMemo(() => responses ?? [], [responses]);

    const authorOptions = useMemo(
        () => [...new Set(items.map((r) => r.projectName))].map((n) => ({ value: n, label: n })),
        [items],
    );

    const projectOptions = useMemo(
        () => [...new Set(items.map((r) => r.projectName))].map((n) => ({ value: n, label: n })),
        [items],
    );

    const filteredItems = useMemo(() => {
        let result = items;

        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (r) => r.projectName.toLowerCase().includes(q) || r.role.toLowerCase().includes(q),
            );
        }

        if (filters.authors.length > 0) {
            result = result.filter((r) => filters.authors.includes(r.projectName));
        }

        if (filters.projects.length > 0) {
            result = result.filter((r) => filters.projects.includes(r.projectName));
        }

        if (filters.roles.length > 0) {
            result = result.filter((r) => filters.roles.includes(r.role));
        }

        if (filters.datePreset !== "all") {
            const now = new Date();
            result = result.filter((r) => {
                const d = new Date(r.date);
                switch (filters.datePreset) {
                    case "today":
                        return (
                            d.getFullYear() === now.getFullYear() &&
                            d.getMonth() === now.getMonth() &&
                            d.getDate() === now.getDate()
                        );
                    case "7days": {
                        const diff = now.getTime() - d.getTime();
                        return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
                    }
                    case "30days": {
                        const diff = now.getTime() - d.getTime();
                        return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
                    }
                    case "custom":
                        if (!filters.customDate) return true;
                        return d >= filters.customDate.from && d <= filters.customDate.to;
                    default:
                        return true;
                }
            });
        }

        return result;
    }, [items, search, filters]);

    const activeFilterCount = [
        filters.authors.length > 0,
        filters.projects.length > 0,
        filters.roles.length > 0,
        filters.datePreset !== "all",
    ].filter(Boolean).length;

    const handleWithdraw = async (responseId: number) => {
        setPendingWithdraw(responseId);
        try {
            await api.patch(`/responses/${responseId}/withdraw`);
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.responses() });
            const item = items.find((r) => r.id === responseId);
            if (item) {
                invalidateProjectImpact(queryClient, item.projectId);
            }
        } catch {
            // ignore
        } finally {
            setPendingWithdraw(null);
        }
    };

    if (isLoading) {
        return (
            <div>
                <ListToolbar
                    title="Мои отклики"
                    searchValue={search}
                    onSearch={setSearch}
                    filtersCount={0}
                    onOpenFilters={() => {}}
                    viewMode={viewMode}
                    onChangeView={setViewMode}
                />
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div>
                <ListToolbar
                    title="Мои отклики"
                    searchValue={search}
                    onSearch={setSearch}
                    filtersCount={0}
                    onOpenFilters={() => {}}
                    viewMode={viewMode}
                    onChangeView={setViewMode}
                />
                <EmptyState
                    icon="rocket"
                    title="У вас пока нет откликов"
                    description="Найдите проекты и отправьте отклик на участие"
                    actionLabel="Найти проекты"
                    onAction={() => {}}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="relative">
                <ListToolbar
                    title="Мои отклики"
                    searchValue={search}
                    onSearch={setSearch}
                    filtersCount={activeFilterCount}
                    onOpenFilters={() => setFiltersOpen((v) => !v)}
                    viewMode={viewMode}
                    onChangeView={setViewMode}
                />

                <ResponsesFilters
                    open={filtersOpen}
                    onClose={() => setFiltersOpen(false)}
                    state={filters}
                    onChange={setFilters}
                    onReset={() => setFilters(defaultProfileFilters)}
                    authorOptions={authorOptions}
                    projectOptions={projectOptions}
                />
            </div>

            {filteredItems.length === 0 ? (
                <div className="text-center py-12 text-[14px] text-gray-500">
                    Отклики не найдены
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
                    {filteredItems.map((item) => {
                        const st = statusLabel[item.status] ?? statusLabel.pending;
                        const actions: ResponseCardAction[] = [];
                        if (item.status === "pending") {
                            actions.push({
                                label: pendingWithdraw === item.id ? "..." : "Отозвать",
                                variant: "outline",
                                onClick: () => handleWithdraw(item.id),
                            });
                        }
                        return (
                            <ResponseCard
                                key={item.id}
                                projectId={item.projectId}
                                projectName={item.projectName}
                                description={item.description}
                                role={item.role}
                                resumeUrl={item.resumeUrl}
                                resumeTitle={item.resumeTitle}
                                date={item.date}
                                dateLabel="Отклик отправлен"
                                status={st}
                                actions={actions}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="bg-app-surface border border-gray-200 rounded-[16px] overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50">
                                <th className="py-3 px-4 font-medium text-gray-500">Проект</th>
                                <th className="py-3 px-4 font-medium text-gray-500">Роль</th>
                                <th className="py-3 px-4 font-medium text-gray-500">Дата</th>
                                <th className="py-3 px-4 font-medium text-gray-500">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const st = statusLabel[item.status] ?? statusLabel.pending;
                                return (
                                    <tr key={item.id} className="border-b border-gray-100">
                                        <td className="py-3 px-4 font-medium text-gray-900">
                                            {item.projectName}
                                        </td>
                                        <td className="py-3 px-4 text-gray-500">{item.role}</td>
                                        <td className="py-3 px-4 text-gray-500">{item.date}</td>
                                        <td className="py-3 px-4">
                                            <span
                                                className="inline-flex items-center h-6 px-2.5 rounded-full text-[12px] font-medium"
                                                style={{
                                                    backgroundColor: st.bg,
                                                    color: st.color,
                                                }}
                                            >
                                                {st.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

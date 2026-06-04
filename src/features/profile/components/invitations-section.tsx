import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useInvitations } from "@/features/profile/api/use-profile-data";
import { ListToolbar } from "./list-toolbar";
import { EmptyState } from "./empty-state";
import { ResponsesFilters } from "./filters/responses-filters";
import { defaultProfileFilters, type ProfileFiltersState } from "@/types/profile";
import { ResponseCard, type ResponseCardAction } from "./response-card";
import { api } from "@/lib/api-client";

const statusLabel: Record<string, { text: string; color: string; bg: string }> = {
    pending: { text: "Ожидает ответа", color: "#D97706", bg: "#FEF3C7" },
    accepted: { text: "Принято", color: "#16A34A", bg: "#DCFCE7" },
    rejected: { text: "Отклонено", color: "#EF4444", bg: "#FEE2E2" },
};

export function InvitationsSection() {
    const queryClient = useQueryClient();
    const { data: invitations, isLoading } = useInvitations();
    const [search, setSearch] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [filters, setFilters] = useState<ProfileFiltersState>(defaultProfileFilters);
    const [pendingAction, setPendingAction] = useState<{ id: number; type: string } | null>(null);

    const items = useMemo(() => invitations ?? [], [invitations]);

    const authorOptions = useMemo(
        () => [...new Set(items.map((r) => r.inviterName))].map((n) => ({ value: n, label: n })),
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
                (r) =>
                    r.projectName.toLowerCase().includes(q) ||
                    r.role.toLowerCase().includes(q) ||
                    r.inviterName.toLowerCase().includes(q),
            );
        }

        if (filters.authors.length > 0) {
            result = result.filter((r) => filters.authors.includes(r.inviterName));
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

    const handleAction = async (invitationId: number, action: "accept" | "reject") => {
        setPendingAction({ id: invitationId, type: action });
        try {
            await api.patch(`/invitations/${invitationId}/${action}`);
            queryClient.invalidateQueries({ queryKey: ["profile", "invitations"] });
        } catch {
            // ignore
        } finally {
            setPendingAction(null);
        }
    };

    if (isLoading) {
        return (
            <div>
                <ListToolbar
                    title="Мои приглашения"
                    searchValue={search}
                    onSearch={setSearch}
                    filtersCount={0}
                    onOpenFilters={() => {}}
                    viewMode={viewMode}
                    onChangeView={setViewMode}
                />
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-[#E5E7EB] border-t-[#2563EB] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div>
                <ListToolbar
                    title="Мои приглашения"
                    searchValue={search}
                    onSearch={setSearch}
                    filtersCount={0}
                    onOpenFilters={() => {}}
                    viewMode={viewMode}
                    onChangeView={setViewMode}
                />
                <EmptyState
                    icon="rocket"
                    title="У вас пока нет приглашений"
                    description="Создайте резюме и сделайте его видимым для других"
                />
            </div>
        );
    }

    return (
        <div>
            <div className="relative">
                <ListToolbar
                    title="Мои приглашения"
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
                <div className="text-center py-12 text-[14px] text-[#6B7280]">
                    Приглашения не найдены
                </div>
            ) : viewMode === "grid" ? (
                <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(360px,1fr))]">
                    {filteredItems.map((item) => {
                        const st = statusLabel[item.status] ?? statusLabel.pending;
                        const isPending = pendingAction?.id === item.id;
                        const actions: ResponseCardAction[] = [];
                        if (item.status === "pending") {
                            actions.push(
                                {
                                    label:
                                        isPending && pendingAction?.type === "reject"
                                            ? "..."
                                            : "Отклонить",
                                    variant: "ghost",
                                    onClick: () => handleAction(item.id, "reject"),
                                },
                                {
                                    label:
                                        isPending && pendingAction?.type === "accept"
                                            ? "..."
                                            : "Принять",
                                    variant: "primary",
                                    onClick: () => handleAction(item.id, "accept"),
                                },
                            );
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
                                dateLabel="Приглашение получено"
                                status={st}
                                actions={actions}
                            />
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border border-[#E5E7EB] rounded-[16px] overflow-hidden">
                    <table className="w-full text-left text-[13px]">
                        <thead>
                            <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB]">
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Проект</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Пригласил</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Роль</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Дата</th>
                                <th className="py-3 px-4 font-medium text-[#6B7280]">Статус</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map((item) => {
                                const st = statusLabel[item.status] ?? statusLabel.pending;
                                return (
                                    <tr key={item.id} className="border-b border-[#F3F4F6]">
                                        <td className="py-3 px-4 font-medium text-[#111827]">
                                            {item.projectName}
                                        </td>
                                        <td className="py-3 px-4 text-[#6B7280]">
                                            {item.inviterName}
                                        </td>
                                        <td className="py-3 px-4 text-[#6B7280]">{item.role}</td>
                                        <td className="py-3 px-4 text-[#6B7280]">{item.date}</td>
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

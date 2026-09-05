import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner/spinner";
import { adminApi } from "@/lib/admin";

const SESSIONS_LIMIT = 20;

const formatDate = (value: string): string => new Date(value).toLocaleString("ru-RU");

const SESSION_STATS: {
    key: "total_sessions" | "active_sessions" | "expired_sessions" | "active_users";
    label: string;
}[] = [
    { key: "total_sessions", label: "Всего сессий" },
    { key: "active_sessions", label: "Активные сессии" },
    { key: "expired_sessions", label: "Истекшие сессии" },
    { key: "active_users", label: "Активных пользователей" },
];

const AdminSessionsPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [onlyActive, setOnlyActive] = useState(false);

    const { data: stats } = useQuery({
        queryKey: ["admin-sessions-stats"],
        queryFn: () => adminApi.getSessionStats(),
    });

    const { data, isLoading, isError } = useQuery({
        queryKey: ["admin-sessions", page, onlyActive],
        queryFn: () => adminApi.getSessions(page, SESSIONS_LIMIT, onlyActive),
    });

    const terminate = useMutation({
        mutationFn: (sessionIds: string[]) => adminApi.terminateSessions(sessionIds),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
            queryClient.invalidateQueries({ queryKey: ["admin-sessions-stats"] });
        },
    });

    const items = data?.items ?? [];
    const totalPages = data?.total_pages ?? 1;

    return (
        <ContentLayout title="Сессии">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">
                        Сессии и безопасность
                    </h1>
                    <p className="text-sm text-[--azure-46]">
                        Активные сессии всех пользователей системы
                    </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {SESSION_STATS.map((stat) => (
                        <div
                            key={stat.key}
                            className="rounded-2xl border border-[--color-black-10] bg-app-surface p-5"
                        >
                            <div className="text-3xl font-bold text-[--grey-4]">
                                {stats ? stats[stat.key] : "—"}
                            </div>
                            <div className="mt-1 text-[13px] text-[--azure-46]">{stat.label}</div>
                        </div>
                    ))}
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-[--grey-4] cursor-pointer">
                        <input
                            type="checkbox"
                            checked={onlyActive}
                            onChange={(e) => {
                                setOnlyActive(e.target.checked);
                                setPage(1);
                            }}
                            className="accent-[#2563EB]"
                        />
                        Только активные сессии
                    </label>
                    <Button
                        variant="outlineSoft"
                        size="hug36"
                        onClick={() => {
                            const activeIds = items.filter((s) => s.is_active).map((s) => s.id);
                            if (activeIds.length > 0) {
                                terminate.mutate(activeIds);
                            }
                        }}
                        disabled={terminate.isPending}
                    >
                        Завершить активные на этой странице
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Spinner size="lg" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-16 text-sm text-[--azure-46]">
                        Не удалось загрузить сессии
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                        Сессии не найдены
                    </div>
                ) : (
                    <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                        <table className="w-full text-left">
                            <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                                <tr>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Пользователь
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Устройство
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        IP
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Статус
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Последняя активность
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Завершить
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-black-10]">
                                {items.map((session) => (
                                    <tr
                                        key={session.id}
                                        className="hover:bg-[--grey-96] transition-colors"
                                    >
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4] font-medium">
                                            {session.user_name ||
                                                (session.user_email ?? `#${session.user_id}`)}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {[
                                                session.device_name,
                                                session.browser_name,
                                                session.operating_system,
                                            ]
                                                .filter(Boolean)
                                                .join(" · ") || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {session.ip_address ?? "—"}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={
                                                    session.is_active
                                                        ? "text-sm font-medium text-green-600"
                                                        : "text-sm font-medium text-gray-400"
                                                }
                                            >
                                                {session.is_current ? "текущая" : ""}{" "}
                                                {session.is_active ? "активная" : "истекшая"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {formatDate(session.last_activity)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="outlineSoft"
                                                size="hug36"
                                                className="h-8 px-2"
                                                onClick={() => terminate.mutate([session.id])}
                                                disabled={!session.is_active || terminate.isPending}
                                            >
                                                Завершить
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                            variant="outlineSoft"
                            size="hug36"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                        >
                            Назад
                        </Button>
                        <span className="text-sm text-[--azure-46]">
                            Страница {page} из {totalPages}
                        </span>
                        <Button
                            variant="outlineSoft"
                            size="hug36"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                        >
                            Вперёд
                        </Button>
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

export default AdminSessionsPage;

import { useQuery } from "@tanstack/react-query";
import { ContentLayout } from "@/components/layouts";
import { Spinner } from "@/components/ui/spinner/spinner";
import { adminApi } from "@/lib/admin";
import type { AdminOverview } from "@/features/admin/types";

const OVERVIEW_CARDS: {
    key: keyof Pick<
        AdminOverview,
        | "total_users"
        | "total_roles"
        | "total_ideas"
        | "total_projects"
        | "total_workspaces"
        | "total_sessions"
        | "active_sessions"
        | "active_users"
    >;
    label: string;
}[] = [
    { key: "total_users", label: "Пользователи" },
    { key: "total_roles", label: "Роли" },
    { key: "total_ideas", label: "Идеи" },
    { key: "total_projects", label: "Проекты" },
    { key: "total_workspaces", label: "Пространства" },
    { key: "total_sessions", label: "Сессий всего" },
    { key: "active_sessions", label: "Активных сессий" },
    { key: "active_users", label: "Активных пользователей" },
];

const formatDate = (value: string): string => new Date(value).toLocaleString("ru-RU");

const AdminOverviewPage = () => {
    const {
        data: overview,
        isLoading,
        isError,
    } = useQuery({
        queryKey: ["admin", "overview"],
        queryFn: () => adminApi.getOverview(),
    });

    if (isLoading) {
        return (
            <ContentLayout title="Обзор">
                <div className="flex items-center justify-center py-24">
                    <Spinner size="lg" />
                </div>
            </ContentLayout>
        );
    }

    if (isError || !overview) {
        return (
            <ContentLayout title="Обзор">
                <div className="text-center py-16 text-sm text-[--azure-46]">
                    Не удалось загрузить статистику
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Обзор">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">Админ-панель</h1>
                    <p className="text-sm text-[--azure-46]">Обзорная статистика по всей системе</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {OVERVIEW_CARDS.map((card) => (
                        <div
                            key={card.key}
                            className="rounded-2xl border border-[--color-black-10] bg-app-surface p-5"
                        >
                            <div className="text-3xl font-bold text-[--grey-4]">
                                {overview[card.key]}
                            </div>
                            <div className="mt-1 text-[13px] text-[--azure-46]">{card.label}</div>
                        </div>
                    ))}
                </div>

                <div className="mt-10">
                    <h2 className="text-xl font-bold text-[--grey-4] mb-4">Недавняя активность</h2>
                    {overview.recent_activity.length === 0 ? (
                        <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                            Записей пока нет
                        </div>
                    ) : (
                        <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                            <table className="w-full text-left">
                                <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                                    <tr>
                                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                            Действие
                                        </th>
                                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                            Сущность
                                        </th>
                                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                            Пользователь
                                        </th>
                                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                            Дата
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[--color-black-10]">
                                    {overview.recent_activity.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="hover:bg-[--grey-96] transition-colors"
                                        >
                                            <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                                {item.action}
                                            </td>
                                            <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                                {item.entity_type} #{item.entity_id}
                                            </td>
                                            <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                                {item.user_name || (item.user_email ?? "—")}
                                            </td>
                                            <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                                {formatDate(item.performed_at)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </ContentLayout>
    );
};

export default AdminOverviewPage;

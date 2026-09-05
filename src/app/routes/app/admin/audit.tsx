import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner/spinner";
import { adminApi } from "@/lib/admin";

const AUDIT_LIMIT = 20;

const formatDate = (value: string): string => new Date(value).toLocaleString("ru-RU");

const AdminAuditPage = () => {
    const [page, setPage] = useState(1);

    const { data, isLoading, isError } = useQuery({
        queryKey: ["admin-audit", page],
        queryFn: () => adminApi.getAudit(page, AUDIT_LIMIT),
    });

    const items = data?.items ?? [];
    const totalPages = data?.total_pages ?? 1;

    return (
        <ContentLayout title="Аудит">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">Журнал аудита</h1>
                    <p className="text-sm text-[--azure-46]">Действия всех пользователей системы</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Spinner size="lg" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-16 text-sm text-[--azure-46]">
                        Не удалось загрузить журнал аудита
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                        Записей пока нет
                    </div>
                ) : (
                    <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                        <table className="w-full text-left">
                            <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                                <tr>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        #
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Пользователь
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Действие
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Сущность
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Дата
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-black-10]">
                                {items.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-[--grey-96] transition-colors"
                                    >
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {item.id}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4] font-medium">
                                            {item.user_name || (item.user_email ?? "—")}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {item.action}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {item.entity_type} #{item.entity_id}
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

export default AdminAuditPage;

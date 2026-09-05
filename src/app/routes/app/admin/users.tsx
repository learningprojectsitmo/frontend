import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";
import { settingsApi } from "@/lib/settings";
import { api } from "@/lib/api-client";
import type { User } from "@/features/settings/types";

const USERS_LIMIT = 10;
const roleLabel = (user: User): string => user.role_name;

const AdminUsersPage = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);

    const { data: usersData, isLoading } = useQuery({
        queryKey: ["admin-users", page],
        queryFn: () => settingsApi.getUsers(page, USERS_LIMIT),
    });

    const { data: rolesData } = useQuery({
        queryKey: ["admin-roles"],
        queryFn: () => settingsApi.getRoles(),
    });

    const updateRole = useMutation({
        mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) =>
            api.put(`/users/${userId}`, { role_id: roleId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });

    const deleteUser = useMutation({
        mutationFn: (userId: number) => api.delete(`/users/${userId}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });

    const users = usersData?.items ?? [];
    const totalPages = usersData?.total_pages ?? 1;
    const isNotEmpty = users.length > 0;

    const handleRoleChange = (userId: number, value: string) => {
        const user = users.find((u) => u.id === userId);
        if (!user) return;
        const roleId = Number(value);
        if (user.role_id === roleId) return;
        updateRole.mutate({ userId, roleId });
    };

    const handleDelete = (userId: number) => {
        if (window.confirm("Удалить пользователя? Действие необратимо.")) {
            deleteUser.mutate(userId);
        }
    };

    return (
        <ContentLayout title="Пользователи">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">Пользователи</h1>
                    <p className="text-sm text-[--azure-46]">
                        Управление пользователями системы: смена роли и удаление аккаунтов
                    </p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Spinner size="lg" />
                    </div>
                ) : !isNotEmpty ? (
                    <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                        Пользователи не найдены
                    </div>
                ) : (
                    <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                        <table className="w-full text-left">
                            <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                                <tr>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        №
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        ФИО
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Email
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Роль
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Номер ИСУ
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Смена роли
                                    </th>
                                    <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                                        Удалить
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[--color-black-10]">
                                {users.map((user, index) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-[--grey-96] transition-colors"
                                    >
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {(page - 1) * USERS_LIMIT + index + 1}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4] font-medium">
                                            {[user.last_name, user.first_name, user.middle_name]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {roleLabel(user)}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            {user.isu_number ?? "—"}
                                        </td>
                                        <td className="px-6 py-4 text-[15px] text-[--grey-4]">
                                            <Select
                                                value={String(user.role_id)}
                                                onValueChange={(value) =>
                                                    handleRoleChange(user.id, value)
                                                }
                                            >
                                                <SelectTrigger className="w-44 h-8 text-[13px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {rolesData?.items.map((role) => (
                                                        <SelectItem
                                                            key={role.id}
                                                            value={String(role.id)}
                                                        >
                                                            {role.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Button
                                                variant="outlineSoft"
                                                size="hug36"
                                                className="h-8 px-2"
                                                icon={<Icon name="trash" size={16} />}
                                                onClick={() => handleDelete(user.id)}
                                                disabled={deleteUser.isPending}
                                            />
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

export default AdminUsersPage;

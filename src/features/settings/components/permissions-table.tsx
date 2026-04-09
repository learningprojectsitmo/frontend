// features/settings/components/permissions-table.tsx
import { Checkbox } from "@/components/ui/checkbox/checkbox.tsx";
import type { Permission } from "../types";

interface PermissionsTableProps {
    permissions: Permission[];
    onPermissionChange: (
        permissionId: string,
        field: keyof Omit<Permission, "id" | "sectionId" | "sectionName">,
        value: boolean,
    ) => void;
}

export const PermissionsTable = ({ permissions, onPermissionChange }: PermissionsTableProps) => {
    // Сортируем permissions по sectionId для консистентности
    const sortedPermissions = [...permissions].sort(
        (a, b) => parseInt(a.sectionId) - parseInt(b.sectionId),
    );

    return (
        <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-white">
            <table className="w-full text-left">
                <thead className="bg-[--grey-98] border-b border-[--color-black-10]">
                    <tr>
                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">№</th>
                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4]">
                            Раздел системы
                        </th>
                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4] text-center">
                            Добавить
                        </th>
                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4] text-center">
                            Редактировать
                        </th>
                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4] text-center">
                            Удалить
                        </th>
                        <th className="px-6 py-4 text-[15px] font-semibold text-[--grey-4] text-center">
                            Просмотр
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[--color-black-10]">
                    {sortedPermissions.map((permission, index) => (
                        <tr key={permission.id} className="hover:bg-[--grey-96] transition-colors">
                            <td className="px-6 py-4 text-[15px] text-[--grey-4]">{index + 1}</td>
                            <td className="px-6 py-4 text-[15px] text-[--grey-4] font-medium">
                                {permission.sectionName}
                            </td>
                            <td className="px-6 py-4 text-center">
                                <Checkbox
                                    checked={permission.canAdd}
                                    onCheckedChange={(checked) =>
                                        onPermissionChange(
                                            permission.id,
                                            "canAdd",
                                            checked as boolean,
                                        )
                                    }
                                />
                            </td>
                            <td className="px-6 py-4 text-center">
                                <Checkbox
                                    checked={permission.canEdit}
                                    onCheckedChange={(checked) =>
                                        onPermissionChange(
                                            permission.id,
                                            "canEdit",
                                            checked as boolean,
                                        )
                                    }
                                />
                            </td>
                            <td className="px-6 py-4 text-center">
                                <Checkbox
                                    checked={permission.canDelete}
                                    onCheckedChange={(checked) =>
                                        onPermissionChange(
                                            permission.id,
                                            "canDelete",
                                            checked as boolean,
                                        )
                                    }
                                />
                            </td>
                            <td className="px-6 py-4 text-center">
                                <Checkbox
                                    checked={permission.canView}
                                    onCheckedChange={(checked) =>
                                        onPermissionChange(
                                            permission.id,
                                            "canView",
                                            checked as boolean,
                                        )
                                    }
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

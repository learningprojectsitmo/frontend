// features/settings/components/permissions-table.tsx
import { Checkbox } from "@/components/ui/checkbox/checkbox.tsx";
import type { Permission } from "../types";

// Разделы, чьи permission-ы реально проверяются в коде бэкенда (другие — только
// отображаются в UI и не влияют на логику прав).
const USED_SECTIONS = new Set(["project", "user"]);

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
        <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
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
                    {sortedPermissions.map((permission, index) => {
                        const isUsed = USED_SECTIONS.has(permission.sectionId);
                        return (
                            <tr key={permission.id} className="hover:bg-[--grey-96] transition-colors">
                                <td className="px-6 py-4 text-[15px] text-[--grey-4]">{index + 1}</td>
                                <td className="px-6 py-4 text-[15px] text-[--grey-4] font-medium">
                                    <div className="flex items-center gap-2">
                                        <span>{permission.sectionName}</span>
                                        {!isUsed && (
                                            <span className="rounded-full bg-[--grey-94] px-2 py-0.5 text-[11px] font-medium text-[--azure-46]">
                                                не используется
                                            </span>
                                        )}
                                    </div>
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
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

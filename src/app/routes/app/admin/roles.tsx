import { useState, useEffect } from "react";
import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { RoleSelect } from "@/features/settings/components/role-select";
import { PermissionsTable } from "@/features/settings/components/permissions-table";
import {
    settingsApi,
    permissionMatrixToPermissions,
    permissionsToPermissionMatrix,
} from "@/lib/settings";
import type { Permission, Role } from "@/features/settings/types";

const AdminRolesPage = () => {
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        settingsApi
            .getRoles()
            .then((data) => {
                const mapped: Role[] = data.items.map((r) => ({
                    id: String(r.id),
                    name: r.name,
                    description: r.description,
                }));
                setRoles(mapped);
            })
            .finally(() => setRolesLoading(false));
    }, []);

    useEffect(() => {
        if (roles.length > 0 && !selectedRoleId) {
            setSelectedRoleId(roles[0].id);
        }
    }, [roles, selectedRoleId]);

    useEffect(() => {
        if (!selectedRoleId) return;
        settingsApi.getRolePermissions(Number(selectedRoleId)).then((matrix) => {
            const perms = permissionMatrixToPermissions(matrix);
            setPermissions(perms);
            setOriginalPermissions(JSON.parse(JSON.stringify(perms)));
            setHasChanges(false);
        });
    }, [selectedRoleId]);

    useEffect(() => {
        if (permissions.length === 0 || originalPermissions.length === 0) {
            setHasChanges(false);
            return;
        }
        const hasUnsavedChanges = permissions.some((perm) => {
            const original = originalPermissions.find((op) => op.id === perm.id);
            if (!original) return true;
            return (
                original.canAdd !== perm.canAdd ||
                original.canEdit !== perm.canEdit ||
                original.canDelete !== perm.canDelete ||
                original.canView !== perm.canView
            );
        });
        setHasChanges(hasUnsavedChanges);
    }, [permissions, originalPermissions]);

    const handlePermissionChange = (
        permissionId: string,
        field: keyof Omit<Permission, "id" | "sectionId" | "sectionName">,
        value: boolean,
    ) => {
        setPermissions((prev) =>
            prev.map((p) => (p.id === permissionId ? { ...p, [field]: value } : p)),
        );
    };

    const handleSave = async () => {
        setSaveLoading(true);
        try {
            const matrix = permissionsToPermissionMatrix(permissions);
            await settingsApi.updateRolePermissions(Number(selectedRoleId), matrix);
            setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
            setHasChanges(false);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleCancel = () => {
        setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
        setHasChanges(false);
    };

    const selectedRole = roles.find((r) => r.id === selectedRoleId);

    return (
        <ContentLayout title="Роли и доступы">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">Роли и доступы</h1>
                    <p className="text-sm text-[--azure-46]">Настройка прав ролей системы</p>
                </div>

                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <RoleSelect
                            roles={roles}
                            selectedRoleId={selectedRoleId}
                            onRoleChange={setSelectedRoleId}
                        />

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outlineSoft"
                                size="hug36"
                                icon={<Icon name="cross" size={18} />}
                                onClick={handleCancel}
                                disabled={!hasChanges}
                            >
                                Отменить изменения
                            </Button>
                            <Button
                                variant="blue"
                                size="hug36"
                                icon={<Icon name="check" size={18} />}
                                onClick={handleSave}
                                disabled={!hasChanges || saveLoading}
                            >
                                {saveLoading ? "Сохранение..." : "Сохранить"}
                            </Button>
                        </div>
                    </div>

                    {rolesLoading ? (
                        <div className="text-center py-16 text-sm text-[--azure-46]">
                            Загрузка...
                        </div>
                    ) : (
                        <>
                            <PermissionsTable
                                permissions={permissions}
                                onPermissionChange={handlePermissionChange}
                            />

                            <div className="text-sm text-[--azure-46] bg-[--grey-96] p-4 rounded-lg">
                                <span className="font-medium text-[--grey-4]">Роль: </span>
                                {selectedRole?.description}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </ContentLayout>
    );
};

export default AdminRolesPage;

import { ContentLayout } from "@/components/layouts";
import { Tabs } from "@/components/ui/tabs/tabs";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { RoleSelect } from "@/features/settings/components/role-select";
import { PermissionsTable } from "@/features/settings/components/permissions-table";
import { UsersTable } from "@/features/settings/components/users-table";
import {
    settingsApi,
    permissionMatrixToPermissions,
    permissionsToPermissionMatrix,
} from "@/lib/settings";
import type { Permission, Role } from "@/features/settings/types";
import { useState, useEffect } from "react";

const RolesSettingsPage = () => {
    const [activeTab, setActiveTab] = useState("roles");
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);
    const [rolesLoading, setRolesLoading] = useState(true);
    const [saveLoading, setSaveLoading] = useState(false);

    const [users, setUsers] = useState<import("@/features/settings/types").User[]>([]);
    const [usersPage, setUsersPage] = useState(1);
    const [usersTotalPages, setUsersTotalPages] = useState(1);
    const [usersLoading, setUsersLoading] = useState(true);
    const USERS_LIMIT = 10;

    const settingsTabs = [
        { value: "roles", label: "Роли и доступы" },
        { value: "general", label: "Общие" },
        { value: "notifications", label: "Уведомления" },
        { value: "security", label: "Безопасность" },
    ];

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

    // Устанавливаем первую роль после загрузки
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

    useEffect(() => {
        setUsersLoading(true);
        settingsApi
            .getUsers(usersPage, USERS_LIMIT)
            .then((data) => {
                setUsers(data.items);
                setUsersTotalPages(data.total_pages);
            })
            .finally(() => setUsersLoading(false));
    }, [usersPage]);

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
        <ContentLayout title="Настройки">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">Настройки</h1>
                    <p className="text-sm text-[--azure-46]">
                        Управляйте настройками аккаунта и правами доступа
                    </p>
                </div>

                <Tabs
                    tabs={settingsTabs}
                    value={activeTab}
                    onValueChange={setActiveTab}
                    variant="text"
                    className="mb-6"
                />

                {activeTab === "roles" && (
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

                        <div className="border-t border-[--color-black-10] pt-8 mt-8">
                            <h2 className="text-xl font-bold text-[--grey-4] mb-4">
                                Список пользователей
                            </h2>
                            <UsersTable
                                users={users}
                                page={usersPage}
                                totalPages={usersTotalPages}
                                onPageChange={setUsersPage}
                                loading={usersLoading}
                            />
                        </div>
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

export default RolesSettingsPage;

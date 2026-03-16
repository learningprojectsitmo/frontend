// app/routes/app/settings/roles.tsx
import { ContentLayout } from "@/components/layouts";
import { Tabs } from "@/components/ui/tabs/tabs";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { RoleSelect } from "@/features/settings/components/role-select";
import { PermissionsTable } from "@/features/settings/components/permissions-table";
import { mockRoles, mockRolePermissions } from "@/features/settings/mock-data";
import type { Permission } from "@/features/settings/types";
import { useState, useEffect } from "react";

const RolesSettingsPage = () => {
    const [activeTab, setActiveTab] = useState("roles");
    const [selectedRoleId, setSelectedRoleId] = useState("1");
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalPermissions, setOriginalPermissions] = useState<Permission[]>([]);

    const settingsTabs = [
        { value: "roles", label: "Роли и доступы" },
        { value: "general", label: "Общие" },
        { value: "notifications", label: "Уведомления" },
        { value: "security", label: "Безопасность" },
    ];

    // Загружаем разрешения при выборе роли
    useEffect(() => {
        const rolePermissions = mockRolePermissions[selectedRoleId] || [];
        setPermissions(rolePermissions);
        setOriginalPermissions(JSON.parse(JSON.stringify(rolePermissions))); // глубокое копирование
        setHasChanges(false);
    }, [selectedRoleId]);

    // Отслеживаем изменения
    useEffect(() => {
        if (permissions.length === 0 || originalPermissions.length === 0) {
            setHasChanges(false);
            return;
        }

        // Сравниваем текущие разрешения с оригинальными
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

    const handleSave = () => {
        // Здесь будет API вызов для сохранения
        console.log("Saving permissions for role:", selectedRoleId, permissions);
        setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
        setHasChanges(false);
        alert("Изменения сохранены");
    };

    const handleCancel = () => {
        setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
        setHasChanges(false);
    };

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
                        {/* Header with role select and action buttons */}
                        <div className="flex items-center justify-between">
                            <RoleSelect
                                roles={mockRoles}
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
                                    disabled={!hasChanges}
                                >
                                    Сохранить
                                </Button>
                            </div>
                        </div>

                        {/* Permissions Table */}
                        <PermissionsTable
                            permissions={permissions}
                            onPermissionChange={handlePermissionChange}
                        />

                        {/* Role info */}
                        <div className="text-sm text-[--azure-46] bg-[--grey-96] p-4 rounded-lg">
                            <span className="font-medium text-[--grey-4]">Роль: </span>
                            {mockRoles.find((r) => r.id === selectedRoleId)?.description}
                        </div>
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

export default RolesSettingsPage;

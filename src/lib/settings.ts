import { api } from "./api-client";
import type {
    Permission,
    RoleListResponse,
    UserListResponse,
    PermissionMatrix,
} from "@/features/settings/types";

const ENTITY_TO_SECTION: Record<string, { id: string; name: string }> = {
    project: { id: "project", name: "Управление проектами" },
    resume: { id: "resume", name: "Резюме и профили" },
    user: { id: "user", name: "Участники команды" },
};

export function permissionMatrixToPermissions(matrix: PermissionMatrix): Permission[] {
    const result: Permission[] = [];
    for (const [entity, element] of Object.entries(matrix.permissions_matrix)) {
        const section = ENTITY_TO_SECTION[entity] ?? { id: entity, name: entity };
        result.push({
            id: section.id,
            sectionId: section.id,
            sectionName: section.name,
            canAdd: element.create,
            canEdit: element.update,
            canDelete: element.delete,
            canView: element.read,
        });
    }
    return result;
}

export function permissionsToPermissionMatrix(permissions: Permission[]): PermissionMatrix {
    const permissions_matrix: Record<
        string,
        { create: boolean; read: boolean; update: boolean; delete: boolean }
    > = {};
    for (const perm of permissions) {
        const entity = perm.sectionId;
        permissions_matrix[entity] = {
            create: perm.canAdd,
            read: perm.canView,
            update: perm.canEdit,
            delete: perm.canDelete,
        };
    }
    return { permissions_matrix };
}

export const settingsApi = {
    getRoles: (): Promise<RoleListResponse> => {
        return api.get("/roles");
    },

    getRolePermissions: (roleId: number): Promise<PermissionMatrix> => {
        return api.get(`/role_permissions/${roleId}`);
    },

    updateRolePermissions: (
        roleId: number,
        matrix: PermissionMatrix,
    ): Promise<PermissionMatrix> => {
        return api.put(`/role_permissions/${roleId}`, matrix);
    },

    getUsers: (page: number, limit: number): Promise<UserListResponse> => {
        return api.get("/users", { params: { page, limit } });
    },
};

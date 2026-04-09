export interface Role {
    id: string;
    name: string;
    description: string;
    userCount: number;
}

export interface Permission {
    id: string;
    sectionId: string;
    sectionName: string;
    canAdd: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canView: boolean;
}

export interface RolePermissions {
    roleId: string;
    permissions: Permission[];
}

export interface Role {
    id: string;
    name: string;
    description: string | null;
}

export interface RoleListResponse {
    items: Role[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
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

export interface User {
    id: number;
    email: string;
    first_name: string;
    middle_name: string;
    last_name: string | null;
    isu_number: number | null;
    tg_nickname: string | null;
    role_id: number;
    role_name: string;
    created_at: string;
}

export interface UserListResponse {
    items: User[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface PermissionMatrixElement {
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
}

export interface PermissionMatrix {
    permissions_matrix: Record<string, PermissionMatrixElement>;
}

export interface SessionDevice {
    device_name: string | null;
    browser_name: string | null;
    browser_version: string | null;
    operating_system: string | null;
    device_type: string | null;
    ip_address: string | null;
    country: string | null;
    city: string | null;
}

export interface SessionItem extends SessionDevice {
    id: string;
    user_id: number;
    created_at: string;
    last_activity: string;
    expires_at: string | null;
    is_active: boolean;
    is_current: boolean;
}

export interface SessionListResponse {
    sessions: SessionItem[];
    total: number;
    current_session_id: string | null;
}

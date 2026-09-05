export interface AdminAuditItem {
    id: number;
    entity_type: string;
    entity_id: number;
    action: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    performed_by: number | null;
    performed_at: string;
    user_name: string;
    user_email: string | null;
}

export interface AdminOverview {
    total_users: number;
    total_roles: number;
    total_ideas: number;
    total_projects: number;
    total_workspaces: number;
    total_sessions: number;
    active_sessions: number;
    active_users: number;
    recent_activity: AdminAuditItem[];
}

export interface AdminSession {
    id: string;
    user_id: number;
    user_name: string;
    user_email: string | null;
    device_name: string | null;
    browser_name: string | null;
    browser_version: string | null;
    operating_system: string | null;
    device_type: string | null;
    ip_address: string | null;
    is_active: boolean;
    is_current: boolean;
    created_at: string;
    last_activity: string;
    expires_at: string | null;
}

export interface AdminSessionsResponse {
    items: AdminSession[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

export interface AdminSessionStats {
    total_sessions: number;
    active_sessions: number;
    expired_sessions: number;
    active_users: number;
}

export interface AdminAuditListResponse {
    items: AdminAuditItem[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
}

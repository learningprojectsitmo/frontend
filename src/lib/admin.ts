import { api } from "./api-client";
import type {
    AdminAuditListResponse,
    AdminOverview,
    AdminSessionStats,
    AdminSessionsResponse,
} from "@/features/admin/types";

export const adminApi = {
    getOverview: (): Promise<AdminOverview> => {
        return api.get("/admin/overview");
    },

    getSessions: (
        page: number,
        limit: number,
        onlyActive = false,
    ): Promise<AdminSessionsResponse> => {
        return api.get("/admin/sessions", { params: { page, limit, only_active: onlyActive } });
    },

    getSessionStats: (): Promise<AdminSessionStats> => {
        return api.get("/admin/sessions/stats");
    },

    terminateSessions: (
        sessionIds: string[],
    ): Promise<{ terminated_sessions: string[]; message: string }> => {
        return api.post("/admin/sessions/terminate", { session_ids: sessionIds });
    },

    getAudit: (page: number, limit: number): Promise<AdminAuditListResponse> => {
        return api.get("/admin/audit", { params: { page, limit } });
    },
};

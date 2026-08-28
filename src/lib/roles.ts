import { useQuery } from "@tanstack/react-query";

import { api } from "./api-client";
import { type Role, type RoleListResponse } from "@/types/api";

export const ROLE_LABELS: Record<string, string> = {
    member: "Участник",
    manager: "Руководитель проекта",
    teacher: "Преподаватель",
    admin: "Администратор",
};

export const roleLabel = (role: Pick<Role, "id" | "name">): string =>
    ROLE_LABELS[role.name] ?? role.name;

export const getRoles = async (): Promise<RoleListResponse> => {
    return await api.get("/roles/");
};

export const useRoles = () => {
    return useQuery({
        queryKey: ["roles"],
        queryFn: getRoles,
        staleTime: 30 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        refetchOnWindowFocus: false,
    });
};

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
    MyResponseListResponse,
    MyInvitationListResponse,
    MyProjectListResponse,
    Space,
} from "@/types/api";
import type { ResponseItem, InvitationItem, ProfileSpace, ProfileProject } from "@/types/profile";
import { useProfile } from "@/lib/profile";

function normalizeResumeUrl(url: string): string {
    const id = url?.split("/").pop();
    return id ? `/app/resume?id=${id}` : "";
}

function mapMyResponseItem(r: MyResponseListResponse["items"][number]): ResponseItem {
    return {
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name,
        description: r.description,
        role: r.role,
        resumeUrl: normalizeResumeUrl(r.resume_url),
        resumeTitle: r.resume_title,
        date: r.date,
        status: r.status as ResponseItem["status"],
    };
}

function mapMyInvitationItem(r: MyInvitationListResponse["items"][number]): InvitationItem {
    return {
        id: r.id,
        projectId: r.project_id,
        projectName: r.project_name,
        description: r.description,
        inviterName: r.inviter_name,
        role: r.role,
        resumeUrl: normalizeResumeUrl(r.resume_url),
        resumeTitle: r.resume_title,
        date: r.date,
        status: r.status as InvitationItem["status"],
    };
}

function mapSpace(s: Space, currentUserId: number): ProfileSpace {
    return {
        id: s.id,
        name: s.title,
        description: s.description,
        role: s.author_id === currentUserId ? "Owner" : "Participant",
        projectsCount: s.projectsCount,
        membersCount: s.membersCount,
    };
}

function mapMyProjectItem(p: MyProjectListResponse["items"][number]): ProfileProject {
    return {
        id: p.id,
        title: p.title,
        description: p.description ?? "",
        status: p.status as ProfileProject["status"],
        progress: p.progress,
        startDate: p.start_date,
        membersCount: p.members_count,
        roles: p.roles,
    };
}

export function useResponses() {
    return useQuery({
        queryKey: ["profile", "responses"],
        queryFn: async () => {
            const data: MyResponseListResponse = await api.get("/responses/my");
            return data.items.map(mapMyResponseItem);
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function useInvitations() {
    return useQuery({
        queryKey: ["profile", "invitations"],
        queryFn: async () => {
            const data: MyInvitationListResponse = await api.get("/invitations/my");
            return data.items.map(mapMyInvitationItem);
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function useProfileSpaces() {
    const { data: profile } = useProfile();
    const currentUserId = profile?.id ?? 0;

    return useQuery({
        queryKey: ["profile", "spaces"],
        queryFn: async () => {
            const data: { spaces: Space[] } = await api.get("/workspaces/menu", {
                params: { page: 1, limit: 100 },
            });
            return data.spaces.map((s) => mapSpace(s, currentUserId));
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

export function useProfileProjects() {
    return useQuery({
        queryKey: ["profile", "projects"],
        queryFn: async () => {
            const data: MyProjectListResponse = await api.get("/projects/my");
            return data.items.map(mapMyProjectItem);
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
}

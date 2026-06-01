import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type ResumeDetail,
    type ResumeEducation,
    type ResumeFull,
    type ResumeLanguage,
    type ResumeLink,
    type ResumeUpdate,
} from "@/types/api";

export const getResumeDetail = async (id: number): Promise<ResumeDetail> => {
    return await api.get(`/resumes/${id}/detail`);
};

export const useResumeDetail = (id: number) => {
    return useQuery({
        queryKey: ["resume", id, "detail"],
        queryFn: () => getResumeDetail(id),
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        enabled: !!id,
    });
};

export const updateResume = async ({
    id,
    data,
}: {
    id: number;
    data: ResumeUpdate;
}): Promise<ResumeFull> => {
    return await api.put(`/resumes/${id}`, data);
};

export const useUpdateResume = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResume,
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ["resume", variables.id, "detail"] });
        },
    });
};

// ─── Resume Link CRUD ──────────────────────────────────────────────────

export const createResumeLink = async ({
    resumeId,
    data,
}: {
    resumeId: number;
    data: { platform: string; url: string; sort_order?: number };
}): Promise<ResumeLink> => {
    return await api.post(`/resumes/${resumeId}/links`, data);
};

export const updateResumeLink = async ({
    linkId,
    data,
}: {
    linkId: number;
    data: { platform?: string; url?: string; sort_order?: number };
}): Promise<ResumeLink> => {
    return await api.put(`/resumes/links/${linkId}`, data);
};

export const deleteResumeLink = async (linkId: number): Promise<void> => {
    return await api.delete(`/resumes/links/${linkId}`);
};

// ─── Resume Education CRUD ────────────────────────────────────────────

export const createResumeEducation = async ({
    resumeId,
    data,
}: {
    resumeId: number;
    data: { institution: string; faculty?: string | null; degree?: string | null; years?: string | null; sort_order?: number };
}): Promise<ResumeEducation> => {
    return await api.post(`/resumes/${resumeId}/educations`, data);
};

export const updateResumeEducation = async ({
    eduId,
    data,
}: {
    eduId: number;
    data: { institution?: string; faculty?: string | null; degree?: string | null; years?: string | null; sort_order?: number };
}): Promise<ResumeEducation> => {
    return await api.put(`/resumes/educations/${eduId}`, data);
};

export const deleteResumeEducation = async (eduId: number): Promise<void> => {
    return await api.delete(`/resumes/educations/${eduId}`);
};

// ─── Resume Language CRUD ─────────────────────────────────────────────

export const createResumeLanguage = async ({
    resumeId,
    data,
}: {
    resumeId: number;
    data: { name: string; level?: string | null; sort_order?: number };
}): Promise<ResumeLanguage> => {
    return await api.post(`/resumes/${resumeId}/languages`, data);
};

export const updateResumeLanguage = async ({
    langId,
    data,
}: {
    langId: number;
    data: { name?: string; level?: string | null; sort_order?: number };
}): Promise<ResumeLanguage> => {
    return await api.put(`/resumes/languages/${langId}`, data);
};

export const deleteResumeLanguage = async (langId: number): Promise<void> => {
    return await api.delete(`/resumes/languages/${langId}`);
};

// ─── React Query mutations ───────────────────────────────────────────

export const useCreateResumeLink = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useUpdateResumeLink = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResumeLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useDeleteResumeLink = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useCreateResumeEducation = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeEducation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useUpdateResumeEducation = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResumeEducation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useDeleteResumeEducation = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeEducation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useCreateResumeLanguage = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeLanguage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useUpdateResumeLanguage = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResumeLanguage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

export const useDeleteResumeLanguage = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeLanguage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["resume", resumeId, "detail"] });
        },
    });
};

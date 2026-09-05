import { api, getApiErrorMessage } from "./api-client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    type ResumeCreate,
    type ResumeDetail,
    type ResumeEducation,
    type ResumeExperience,
    type ResumeFull,
    type ResumeInterest,
    type ResumeLanguage,
    type ResumeLink,
    type ResumeSkill,
    type ResumeUpdate,
} from "@/types/api";
import { queryKeys } from "./query-keys";

const onSaveError = (error: unknown) =>
    toast.error(getApiErrorMessage(error, "Не удалось сохранить изменения"));
const onDeleteError = (error: unknown) =>
    toast.error(getApiErrorMessage(error, "Не удалось удалить"));

export const getResumeDetail = async (id: number): Promise<ResumeDetail> => {
    return await api.get(`/resumes/${id}/detail`);
};

export const useResumeDetail = (id: number) => {
    return useQuery({
        queryKey: queryKeys.resume.detail(id),
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
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
        },
        onError: onSaveError,
    });
};

export const createResume = async (data: ResumeCreate): Promise<ResumeFull> => {
    return await api.post("/resumes/", data);
};

export const useCreateResume = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResume,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(data.id) });
        },
        onError: onSaveError,
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
    data: {
        institution: string;
        faculty?: string | null;
        degree?: string | null;
        years?: string | null;
        sort_order?: number;
    };
}): Promise<ResumeEducation> => {
    return await api.post(`/resumes/${resumeId}/educations`, data);
};

export const updateResumeEducation = async ({
    eduId,
    data,
}: {
    eduId: number;
    data: {
        institution?: string;
        faculty?: string | null;
        degree?: string | null;
        years?: string | null;
        sort_order?: number;
    };
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

// ─── Resume Experience CRUD ──────────────────────────────────────────

export const createResumeExperience = async ({
    resumeId,
    data,
}: {
    resumeId: number;
    data: {
        company: string;
        position: string;
        experience_type?: string | null;
        period_from?: string | null;
        period_to?: string | null;
        duration?: string | null;
        description?: string | null;
        responsibilities?: string[] | null;
        skills?: string[] | null;
        sort_order?: number;
    };
}): Promise<ResumeExperience> => {
    return await api.post(`/resumes/${resumeId}/experiences`, data);
};

export const updateResumeExperience = async ({
    expId,
    data,
}: {
    expId: number;
    data: {
        company?: string;
        position?: string;
        experience_type?: string | null;
        period_from?: string | null;
        period_to?: string | null;
        duration?: string | null;
        description?: string | null;
        responsibilities?: string[] | null;
        skills?: string[] | null;
        sort_order?: number;
    };
}): Promise<ResumeExperience> => {
    return await api.put(`/resumes/experiences/${expId}`, data);
};

export const deleteResumeExperience = async (expId: number): Promise<void> => {
    return await api.delete(`/resumes/experiences/${expId}`);
};

export const deleteResumeLanguage = async (langId: number): Promise<void> => {
    return await api.delete(`/resumes/languages/${langId}`);
};

// ─── Resume Skill CRUD ────────────────────────────────────────────────

export const createResumeSkill = async ({
    resumeId,
    data,
}: {
    resumeId: number;
    data: { name: string; sort_order?: number };
}): Promise<ResumeSkill> => {
    return await api.post(`/resumes/${resumeId}/skills`, data);
};

export const deleteResumeSkill = async (skillId: number): Promise<void> => {
    return await api.delete(`/resumes/skills/${skillId}`);
};

// ─── Resume Interest CRUD ─────────────────────────────────────────────

export const createResumeInterest = async ({
    resumeId,
    data,
}: {
    resumeId: number;
    data: { name: string; sort_order?: number };
}): Promise<ResumeInterest> => {
    return await api.post(`/resumes/${resumeId}/interests`, data);
};

export const deleteResumeInterest = async (interestId: number): Promise<void> => {
    return await api.delete(`/resumes/interests/${interestId}`);
};

// ─── React Query mutations ───────────────────────────────────────────

export const useCreateResumeLink = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useUpdateResumeLink = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResumeLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useDeleteResumeLink = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeLink,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onDeleteError,
    });
};

export const useCreateResumeEducation = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeEducation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useUpdateResumeEducation = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResumeEducation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useDeleteResumeEducation = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeEducation,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onDeleteError,
    });
};

export const useCreateResumeLanguage = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeLanguage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useUpdateResumeLanguage = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResumeLanguage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

// ─── React Query mutations: Experience ─────────────────────────────

export const useCreateResumeExperience = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeExperience,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useUpdateResumeExperience = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateResumeExperience,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useDeleteResumeExperience = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeExperience,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onDeleteError,
    });
};

export const useDeleteResumeLanguage = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeLanguage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onDeleteError,
    });
};

// ─── React Query mutations: Skills ──────────────────────────────────

export const useCreateResumeSkill = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeSkill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useDeleteResumeSkill = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeSkill,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onDeleteError,
    });
};

// ─── React Query mutations: Interests ──────────────────────────────

export const useCreateResumeInterest = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createResumeInterest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onSaveError,
    });
};

export const useDeleteResumeInterest = (resumeId: number) => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteResumeInterest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(resumeId) });
        },
        onError: onDeleteError,
    });
};

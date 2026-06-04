import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PortfolioFull, EducationFull, LanguageFull, ProfileResponse } from "@/types/api";
import { api } from "./api-client";

export const getProfile = async (): Promise<ProfileResponse> => {
    return await api.get("/profile");
};

export const useProfile = () => {
    return useQuery({
        queryKey: ["profile"],
        queryFn: getProfile,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
    });
};

// ─── Portfolio CRUD ────────────────────────────────────────────────────

export const createPortfolio = async (data: {
    title: string;
    url: string;
}): Promise<PortfolioFull> => {
    return await api.post("/profile/portfolio", data);
};

export const updatePortfolio = async ({
    id,
    data,
}: {
    id: number;
    data: { title?: string; url?: string };
}): Promise<PortfolioFull> => {
    return await api.put(`/profile/portfolio/${id}`, data);
};

export const deletePortfolio = async (id: number): Promise<void> => {
    return await api.delete(`/profile/portfolio/${id}`);
};

export const useCreatePortfolio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createPortfolio,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

export const useUpdatePortfolio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updatePortfolio,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

export const useDeletePortfolio = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deletePortfolio,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

// ─── Education CRUD ────────────────────────────────────────────────────

export const createEducation = async (data: {
    institution: string;
    faculty: string;
    degree: string;
    years: string;
}): Promise<EducationFull> => {
    return await api.post("/profile/education", data);
};

export const updateEducation = async ({
    id,
    data,
}: {
    id: number;
    data: { institution?: string; faculty?: string; degree?: string; years?: string };
}): Promise<EducationFull> => {
    return await api.put(`/profile/education/${id}`, data);
};

export const deleteEducation = async (id: number): Promise<void> => {
    return await api.delete(`/profile/education/${id}`);
};

export const useCreateEducation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createEducation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

export const useUpdateEducation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateEducation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

export const useDeleteEducation = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteEducation,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

// ─── Language CRUD ─────────────────────────────────────────────────────

export const createLanguage = async (data: {
    name: string;
    level: string;
    flag: string;
}): Promise<LanguageFull> => {
    return await api.post("/profile/languages", data);
};

export const updateLanguage = async ({
    id,
    data,
}: {
    id: number;
    data: { name?: string; level?: string; flag?: string };
}): Promise<LanguageFull> => {
    return await api.put(`/profile/languages/${id}`, data);
};

export const deleteLanguage = async (id: number): Promise<void> => {
    return await api.delete(`/profile/languages/${id}`);
};

export const useCreateLanguage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: createLanguage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

export const useUpdateLanguage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: updateLanguage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

export const useDeleteLanguage = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: deleteLanguage,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile"] }),
    });
};

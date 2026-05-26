import { api } from "./api-client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { type ResumeDetail, type ResumeFull, type ResumeUpdate } from "@/types/api";

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

import { api } from "./api-client";
import { useQuery } from "@tanstack/react-query";
import { type ResumeDetail } from "@/types/api";

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

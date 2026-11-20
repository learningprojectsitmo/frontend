import { useQueries } from "@tanstack/react-query";
import { getProject } from "@/lib/projects";
import { queryKeys } from "@/lib/query-keys";
import type { ProjectFullResponse, ProjectListItemResponse } from "@/types/api";

type ExamProject = ProjectListItemResponse | ProjectFullResponse;

export function getExamProjectLeader(project?: ExamProject): string | undefined {
    if (!project) return;
    const author = "author_name" in project ? project.author_name.trim() : "";
    const preview = project.participants_preview.find((person) => person.id === project.author_id);
    const previewName = preview?.full_name.trim();
    return author || (previewName === "Unknown" ? undefined : previewName) || undefined;
}

export function useExamProjects(
    projects: ProjectListItemResponse[],
    assignedProjectIds: number[],
    listLoading: boolean,
) {
    const projectById = new Map<number, ExamProject>(
        projects.map((project) => [project.id, project]),
    );
    const missing = listLoading
        ? []
        : [...new Set(assignedProjectIds)].filter(
              (id) => !getExamProjectLeader(projectById.get(id)),
          );
    const details = useQueries({
        queries: missing.map((id) => ({
            queryKey: queryKeys.project.detail(id),
            queryFn: () => getProject(String(id)),
            staleTime: 5 * 60_000,
        })),
    });
    for (const { data } of details) {
        if (data) projectById.set(data.id, data);
    }
    return projectById;
}

import { ExamErrorState } from "@/features/exam/components/exam-error-state";
import { useParams, useNavigate, useSearchParams, Navigate } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ExamAdminPanel } from "@/features/exam/components/exam-admin-panel";
import { useExamWorkspaces } from "@/features/exam/use-exam-workspaces";
import { useProjectTypes } from "@/lib/projects";
import { isExamAccessDenied, useExam } from "@/lib/exams";
import { paths } from "@/config/paths";

export default function ExamEditRoute() {
    const { examId: examIdParam } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const workspaceId = Number(params.get("workspaceId") || 0);
    const examId = Number(examIdParam || 0);
    const initialSection = params.get("section") === "queue" ? "queue" : "main";
    const access = useExamWorkspaces(workspaceId);
    const projectTypes = useProjectTypes(workspaceId, access.canManage);
    const exam = useExam(workspaceId, access.canManage ? examId : 0);
    const workspaceName =
        access.spaces.find((item) => item.id === workspaceId)?.title ??
        `Пространство ${workspaceId}`;

    if (access.isLoading || exam.isLoading || projectTypes.isLoading) {
        return (
            <ContentLayout title="Редактирование экзамена">
                <div className="flex h-64 items-center justify-center">
                    <Spinner />
                </div>
            </ContentLayout>
        );
    }

    if (!workspaceId || !access.canManage)
        return <Navigate to={paths.app.exams.getHref(workspaceId)} replace />;

    if (!exam.data || isExamAccessDenied(exam.error)) {
        return (
            <ContentLayout title="Редактирование экзамена">
                <ExamErrorState
                    message={
                        isExamAccessDenied(exam.error) || !exam.isError
                            ? "Экзамен недоступен."
                            : "Не удалось загрузить экзамен."
                    }
                    retry={
                        exam.isError && !isExamAccessDenied(exam.error)
                            ? () => void exam.refetch()
                            : undefined
                    }
                    pending={exam.isFetching}
                />
            </ContentLayout>
        );
    }

    if (projectTypes.isError && !projectTypes.data) {
        return (
            <ContentLayout title="Редактирование экзамена">
                <ExamErrorState
                    message="Не удалось загрузить типы проектов."
                    retry={() => void projectTypes.refetch()}
                    pending={projectTypes.isFetching}
                />
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Редактирование экзамена">
            <div className="mx-auto max-w-7xl p-4 sm:p-8">
                <ExamAdminPanel
                    key={`${workspaceId}:${examId}:${initialSection}`}
                    initialSection={initialSection}
                    workspaceId={workspaceId}
                    workspaceName={workspaceName}
                    projectTypes={projectTypes.data ?? []}
                    exam={exam.data}
                    onCancel={() => navigate(paths.app.examManage.getHref(workspaceId))}
                    onSaved={(saved) =>
                        navigate(
                            paths.app.examEdit.getHref(workspaceId, saved.id) +
                                (initialSection === "queue" ? "&section=queue" : ""),
                        )
                    }
                />
            </div>
        </ContentLayout>
    );
}

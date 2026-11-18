import { useParams, useNavigate, useSearchParams, Navigate } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ExamAdminPanel } from "@/features/exam/components/exam-admin-panel";
import { useExamWorkspaces } from "@/features/exam/use-exam-workspaces";
import { useProjectTypes } from "@/lib/projects";
import { useExam } from "@/lib/exams";
import { paths } from "@/config/paths";

export default function ExamEditRoute() {
    const { examId: examIdParam } = useParams();
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const workspaceId = Number(params.get("workspaceId") || 0);
    const examId = Number(examIdParam || 0);
    const access = useExamWorkspaces(workspaceId);
    const projectTypes = useProjectTypes(workspaceId, access.canManage);
    const exam = useExam(workspaceId, access.canManage ? examId : 0);
    const workspaceName =
        access.spaces.find((item) => item.id === workspaceId)?.title ??
        `Пространство ${workspaceId}`;

    if (access.isLoading || exam.isLoading) {
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

    if (!exam.data) {
        return (
            <ContentLayout title="Редактирование экзамена">
                <div className="p-8 text-app-muted">
                    {exam.isError ? "Не удалось загрузить экзамен." : "Экзамен не найден."}
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Редактирование экзамена">
            <div className="mx-auto max-w-7xl p-4 sm:p-8">
                <ExamAdminPanel
                    key={`${workspaceId}:${examId}`}
                    workspaceId={workspaceId}
                    workspaceName={workspaceName}
                    projectTypes={projectTypes.data ?? []}
                    exam={exam.data}
                    onCancel={() => navigate(paths.app.examManage.getHref(workspaceId))}
                    onSaved={(saved) => navigate(paths.app.examEdit.getHref(workspaceId, saved.id))}
                />
            </div>
        </ContentLayout>
    );
}

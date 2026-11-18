import { useNavigate, useSearchParams, Navigate } from "react-router";
import { useState } from "react";
import { ContentLayout } from "@/components/layouts";
import { ExamAdminPanel, type ExamBasics } from "@/features/exam/components/exam-admin-panel";
import { useExamWorkspaces } from "@/features/exam/use-exam-workspaces";
import { Spinner } from "@/components/ui/spinner/spinner";
import { useProjectTypes } from "@/lib/projects";
import { paths } from "@/config/paths";

export default function ExamNewRoute() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const workspaceId = Number(params.get("workspaceId") || 0);
    const [selection, setSelection] = useState<{ id: number; basics?: ExamBasics }>({ id: workspaceId });
    const selectedWorkspaceId = selection.id;
    const access = useExamWorkspaces();
    const canCreate = selectedWorkspaceId
        ? access.manageable.some((space) => space.id === selectedWorkspaceId)
        : access.canManage;
    const projectTypes = useProjectTypes(
        selectedWorkspaceId,
        canCreate && Boolean(selectedWorkspaceId),
    );
    const workspaceName =
        access.manageable.find((item) => item.id === selectedWorkspaceId)?.title ??
        (selectedWorkspaceId ? `Пространство ${selectedWorkspaceId}` : "");

    if (access.isLoading) {
        return (
            <ContentLayout title="Создание экзамена">
                <div className="flex h-64 items-center justify-center">
                    <Spinner />
                </div>
            </ContentLayout>
        );
    }

    if (!canCreate) return <Navigate to={paths.app.exams.getHref(selectedWorkspaceId)} replace />;

    return (
        <ContentLayout title="Создание экзамена">
            <div className="mx-auto max-w-7xl p-4 sm:p-8">
                <ExamAdminPanel
                    key={selectedWorkspaceId}
                    workspaceId={selectedWorkspaceId}
                    workspaceName={workspaceName}
                    projectTypes={projectTypes.data ?? []}
                    workspaces={access.manageable.map((space) => ({
                        id: space.id,
                        title: space.title,
                    }))}
                    initialBasics={selection.basics}
                    onWorkspaceChange={(id, basics) => setSelection({ id, basics })}
                    onCancel={() => navigate(paths.app.examManage.getHref(selectedWorkspaceId))}
                    onSaved={(exam) =>
                        navigate(paths.app.examEdit.getHref(selectedWorkspaceId, exam.id))
                    }
                />
            </div>
        </ContentLayout>
    );
}

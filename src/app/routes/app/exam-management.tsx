import { useSearchParams, Link, useNavigate, Navigate } from "react-router";
import { ChevronLeft } from "lucide-react";

import { ContentLayout } from "@/components/layouts";
import { Spinner } from "@/components/ui/spinner/spinner";
import { useExamWorkspaces } from "@/features/exam/use-exam-workspaces";
import { paths } from "@/config/paths";
import { ExamManagementList } from "@/features/exam/components/exam-management-list";

export default function ExamManagementRoute() {
    const [params] = useSearchParams();
    const navigate = useNavigate();
    const workspaceId = Number(params.get("workspaceId") || 0);
    const access = useExamWorkspaces(workspaceId);
    const allAccess = useExamWorkspaces(0, !workspaceId || access.canManage);

    if (access.isLoading) {
        return (
            <ContentLayout title="Управление экзаменами">
                <div className="flex h-64 items-center justify-center">
                    <Spinner />
                </div>
            </ContentLayout>
        );
    }

    if (!access.canManage) return <Navigate to={paths.app.exams.getHref(workspaceId)} replace />;

    return (
        <ContentLayout title="Управление экзаменами">
            <div className="mx-auto max-w-7xl p-4 sm:p-8">
                {workspaceId > 0 && (
                    <Link
                        to={`/app/space?id=${workspaceId}`}
                        className="mb-2 inline-flex items-center gap-1 text-[13px] text-app-muted hover:text-app-text"
                    >
                        <ChevronLeft size={14} /> Вернуться в пространство
                    </Link>
                )}
                <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                    <h1 className="text-[26px] font-bold text-app-text sm:text-[32px]">
                        Управление экзаменами
                    </h1>
                    <label className="text-[12px] font-medium text-app-muted">
                        Пространство
                        <select
                            value={workspaceId || ""}
                            onChange={(event) => {
                                const next = Number(event.target.value);
                                navigate(paths.app.examManage.getHref(next));
                            }}
                            className="ml-2 h-10 rounded-[12px] border border-gray-200 dark:border-app-border bg-app-surface px-3 text-[13px] text-app-text"
                        >
                            <option value="">Все пространства</option>
                            {allAccess.manageable.map((space) => (
                                <option key={space.id} value={space.id}>
                                    {space.title}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>
                <ExamManagementList
                    workspaceId={workspaceId}
                    workspaces={allAccess.manageable.map((space) => ({
                        id: space.id,
                        title: space.title,
                    }))}
                />
            </div>
        </ContentLayout>
    );
}

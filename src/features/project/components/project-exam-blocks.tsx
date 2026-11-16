import { useEffect, useMemo, useState } from "react";
import { ExternalLink, GraduationCap, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useExams } from "@/lib/exams";
import { paths } from "@/config/paths";

const formatRemaining = (seconds: number): string => {
    if (seconds <= 0) return "Экзамен уже начался";
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days} дн. ${hours} ч.`;
    if (hours > 0) return `${hours} ч. ${minutes} мин.`;
    return `${minutes} мин.`;
};

export function ProjectExamBlocks({
    workspaceId,
    projectTypeId,
}: {
    workspaceId: number;
    projectTypeId: number | null;
}) {
    const { data } = useExams(workspaceId, "published");
    const [now, setNow] = useState(() => Date.now());
    const exams = useMemo(
        () =>
            (data?.items ?? []).filter(
                (exam) =>
                    projectTypeId !== null &&
                    exam.configuration.project_type_ids.includes(projectTypeId),
            ),
        [data, projectTypeId],
    );
    const exam = exams[0];

    useEffect(() => {
        if (!exam) return;
        const timer = window.setInterval(() => setNow(Date.now()), 30_000);
        return () => window.clearInterval(timer);
    }, [exam]);

    if (!exam) return null;

    const startsAt = new Date(exam.configuration.starts_at).getTime();
    const remaining = Math.max(0, Math.ceil((startsAt - now) / 1000));

    return (
        <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
                <div className="mb-3 flex items-center gap-2 text-blue-700">
                    <Timer className="size-5" />
                    <h2 className="font-semibold">До экзамена</h2>
                </div>
                <p className="text-2xl font-bold text-app-text">{formatRemaining(remaining)}</p>
                <p className="mt-1 text-sm text-app-muted">
                    Начало: {new Date(exam.configuration.starts_at).toLocaleString("ru-RU")}
                </p>
            </div>
            <div className="rounded-2xl border border-[--color-black-10] bg-app-surface p-5">
                <div className="mb-3 flex items-center gap-2 text-app-text">
                    <GraduationCap className="size-5" />
                    <h2 className="font-semibold">Экзамен для студентов дисциплины</h2>
                </div>
                <p className="text-sm text-app-muted">{exam.configuration.title}</p>
                <Button
                    className="mt-4"
                    variant="blue"
                    size="hug36"
                    icon={<ExternalLink />}
                    onClick={() =>
                        (window.location.href = paths.app.examView.getHref(workspaceId, exam.id))
                    }
                >
                    Открыть экзамен
                </Button>
            </div>
        </section>
    );
}

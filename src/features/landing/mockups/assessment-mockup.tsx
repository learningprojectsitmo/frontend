import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/icons";
import { cn } from "@/lib/utils";

type MockCriterion = {
    title: string;
    score: number;
};

type MockRoleScore = {
    role: string;
    weight: string;
    score: string;
};

type AssessmentMock = {
    title: string;
    queue: string;
    countdown: string;
    hint: string;
    criteria: MockCriterion[];
    comment: string;
    points: string;
    submit: string;
    resultTitle: string;
    score: string;
    maxScore: string;
    status: string;
    roleScores: MockRoleScore[];
};

const SCORES = [1, 2, 3, 4, 5] as const;

/**
 * Иллюстрация оценивания защиты: форма с критериями и итог команды. Как и
 * `KanbanMockup`, это статичный мокап на тех же цветовых токенах, что и
 * приложение, — без запросов и без интерактивных элементов.
 */
export const AssessmentMockup = () => {
    const { t } = useTranslation();

    const mockup = t("landing.assessment.mockup", {
        returnObjects: true,
    }) as unknown as AssessmentMock;

    return (
        <div
            role="img"
            aria-label={t("landing.assessment.mockupLabel")}
            className="pointer-events-none w-full select-none overflow-hidden rounded-2xl border border-gray-200 bg-app-surface shadow-xl shadow-gray-900/5"
        >
            {/* Шапка: какая команда защищается, очередь и таймер окна оценивания */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                    <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                        <Icon name="exam" size={15} />
                    </span>
                    <p className="truncate text-xs font-semibold text-gray-900">{mockup.title}</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span className="whitespace-nowrap">{mockup.queue}</span>
                    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-gray-50 px-2 py-1 font-medium text-gray-600">
                        <Icon name="clock" size={11} />
                        {mockup.countdown}
                    </span>
                </div>
            </div>

            <div className="grid gap-4 p-4 lg:grid-cols-[1.5fr_1fr]">
                {/* Форма оценивания */}
                <div className="min-w-0">
                    <p className="text-[11px] font-medium text-gray-500">{mockup.hint}</p>

                    <div className="mt-3 space-y-3">
                        {mockup.criteria.map((criterion) => (
                            <div key={criterion.title}>
                                <p className="truncate text-xs font-medium text-gray-900">
                                    {criterion.title}
                                </p>
                                <div className="mt-1.5 grid grid-cols-5 divide-x divide-gray-200 overflow-hidden rounded-lg border border-gray-200">
                                    {SCORES.map((score) => (
                                        <span
                                            key={score}
                                            className={cn(
                                                "grid h-7 place-items-center text-[11px] tabular-nums",
                                                score === criterion.score
                                                    ? "bg-gray-900 font-semibold text-white"
                                                    : "bg-gray-50 text-gray-500",
                                            )}
                                        >
                                            {score}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-3 rounded-lg border border-dashed border-gray-200 px-3 py-2 text-[11px] text-gray-400">
                        {mockup.comment}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[11px] font-medium text-gray-600">
                            {mockup.points}
                        </span>
                        <span className="rounded-lg bg-app-blue px-3 py-1.5 text-[11px] font-semibold text-white">
                            {mockup.submit}
                        </span>
                    </div>
                </div>

                {/* Итог команды: веса ролей и опубликованный балл */}
                <div className="min-w-0 rounded-xl bg-gray-50 p-4">
                    <p className="text-[11px] font-medium text-gray-500">{mockup.resultTitle}</p>
                    <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-2xl font-bold tabular-nums text-gray-900">
                            {mockup.score}
                        </span>
                        <span className="text-[11px] text-gray-500">{mockup.maxScore}</span>
                    </div>
                    <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                        {mockup.status}
                    </span>

                    <dl className="mt-4 space-y-2 border-t border-gray-200 pt-3">
                        {mockup.roleScores.map((row) => (
                            <div
                                key={row.role}
                                className="flex items-center justify-between gap-2 text-[11px]"
                            >
                                <dt className="min-w-0 truncate text-gray-500">
                                    {row.role} <span className="text-gray-400">{row.weight}</span>
                                </dt>
                                <dd className="shrink-0 font-semibold tabular-nums text-gray-900">
                                    {row.score}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </div>
        </div>
    );
};

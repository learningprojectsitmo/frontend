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

type QueueState = "current" | "waiting" | "done";

type MockQueueItem = {
    name: string;
    time: string;
    status: string;
    state: QueueState;
};

type AssessmentMock = {
    window: string;
    breadcrumb: string;
    examTitle: string;
    examSubtitle: string;
    examStatus: string;
    date: string;
    queueTitle: string;
    queueCount: string;
    queue: MockQueueItem[];
    assessmentTitle: string;
    countdown: string;
    hint: string;
    criteria: MockCriterion[];
    comment: string;
    points: string;
    submit: string;
    resultTitle: string;
    score: string;
    maxScore: string;
    resultStatus: string;
    roleScores: MockRoleScore[];
};

const SCORES = [1, 2, 3, 4, 5] as const;

const queueRowClass: Record<QueueState, string> = {
    current: "border-indigo-200 bg-indigo-50/70",
    waiting: "border-transparent bg-gray-50",
    done: "border-transparent bg-gray-50 opacity-70",
};

const queueStatusClass: Record<QueueState, string> = {
    current: "bg-indigo-100 text-indigo-700",
    waiting: "bg-gray-100 text-gray-500",
    done: "bg-emerald-50 text-emerald-700",
};

/**
 * Мокап страницы оценивания: окно приложения, очередь выступлений, форма
 * оценки и итог команды. Как и `KanbanMockup`, это статичная иллюстрация на
 * токенах приложения — без запросов и интерактивных элементов.
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
            {/* Строка браузера: подчёркивает, что это страница приложения */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-gray-50 px-4 py-2.5">
                <div className="flex shrink-0 gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                    <span className="h-2 w-2 rounded-full bg-gray-300" />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md border border-gray-200 bg-app-surface px-2.5 py-1">
                    <Icon name="link" size={10} className="shrink-0 text-gray-400" />
                    <span className="truncate text-[10px] text-gray-400">{mockup.window}</span>
                </div>
            </div>

            <div className="p-3 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] text-gray-400">{mockup.breadcrumb}</p>
                    <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 px-2 py-1 text-[10px] text-gray-500">
                        <Icon name="calendar" size={10} />
                        {mockup.date}
                    </span>
                </div>

                {/* Шапка экзамена */}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-indigo-600 text-white">
                        <Icon name="exam" size={20} />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-[15px] font-bold leading-tight text-gray-900">
                                {mockup.examTitle}
                            </p>
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                {mockup.examStatus}
                            </span>
                        </div>
                        <p className="text-[11px] text-gray-500">{mockup.examSubtitle}</p>
                    </div>
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-[0.85fr_1.35fr_0.9fr]">
                    {/* Очередь защит */}
                    <div className="min-w-0 rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between gap-2">
                            <p className="text-[11px] font-semibold text-gray-900">
                                {mockup.queueTitle}
                            </p>
                            <span className="shrink-0 text-[10px] text-gray-400">
                                {mockup.queueCount}
                            </span>
                        </div>

                        <ul className="mt-2.5 space-y-1.5">
                            {mockup.queue.map((item) => (
                                <li
                                    key={item.name}
                                    className={cn(
                                        "rounded-lg border px-2 py-1.5",
                                        queueRowClass[item.state],
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={cn(
                                                "truncate text-[11px]",
                                                item.state === "current"
                                                    ? "font-semibold text-gray-900"
                                                    : "text-gray-600",
                                            )}
                                        >
                                            {item.name}
                                        </span>
                                        <span
                                            className={cn(
                                                "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                                                queueStatusClass[item.state],
                                            )}
                                        >
                                            {item.status}
                                        </span>
                                    </div>
                                    <p className="mt-0.5 text-[9px] tabular-nums text-gray-400">
                                        {item.time}
                                    </p>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Форма оценивания */}
                    <div className="min-w-0 rounded-xl border border-gray-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-1">
                            <p className="text-[11px] font-semibold text-gray-900">
                                {mockup.assessmentTitle}
                            </p>
                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[10px] text-amber-600">
                                <Icon name="clock" size={10} />
                                {mockup.countdown}
                            </span>
                        </div>
                        <p className="mt-1 text-[10px] text-gray-400">{mockup.hint}</p>

                        <div className="mt-2.5 space-y-2">
                            {mockup.criteria.map((criterion) => (
                                <div key={criterion.title}>
                                    <p className="truncate text-[10px] font-medium text-gray-700">
                                        {criterion.title}
                                    </p>
                                    <div className="mt-1 grid grid-cols-5 divide-x divide-gray-200 overflow-hidden rounded-md border border-gray-200">
                                        {SCORES.map((score) => (
                                            <span
                                                key={score}
                                                className={cn(
                                                    "grid h-6 place-items-center text-[10px] tabular-nums",
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

                        <div className="mt-2 rounded-md border border-dashed border-gray-200 px-2 py-1.5 text-[10px] text-gray-400">
                            {mockup.comment}
                        </div>

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-medium text-gray-600">
                                {mockup.points}
                            </span>
                            <span className="rounded-md bg-app-blue px-2 py-1 text-[10px] font-semibold text-white">
                                {mockup.submit}
                            </span>
                        </div>
                    </div>

                    {/* Итог команды */}
                    <div className="min-w-0 rounded-xl bg-gray-50 p-3">
                        <p className="text-[10px] font-medium text-gray-500">
                            {mockup.resultTitle}
                        </p>
                        <div className="mt-0.5 flex items-baseline gap-1">
                            <span className="text-xl font-bold tabular-nums text-gray-900">
                                {mockup.score}
                            </span>
                            <span className="text-[10px] text-gray-500">{mockup.maxScore}</span>
                        </div>
                        <span className="mt-1 inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-semibold text-emerald-700">
                            {mockup.resultStatus}
                        </span>

                        <dl className="mt-3 space-y-1.5 border-t border-gray-200 pt-2.5">
                            {mockup.roleScores.map((row) => (
                                <div
                                    key={row.role}
                                    className="flex items-center justify-between gap-2 text-[10px]"
                                >
                                    <dt className="min-w-0 truncate text-gray-500">
                                        {row.role}{" "}
                                        <span className="text-gray-400">{row.weight}</span>
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
        </div>
    );
};

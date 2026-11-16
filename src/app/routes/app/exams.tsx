import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, ExternalLink, Play, Plus, ShieldCheck, Building2, MoreHorizontal, Users } from "lucide-react";
import { ContentLayout } from "@/components/layouts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner/spinner";
import { DatePicker } from "@/components/ui/date-picker";
import { useUser } from "@/lib/auth";
import { useProjectTypes, useProjectsList } from "@/lib/projects";
import { useSpacesList } from "@/lib/spaces";
import {
    examApi,
    getExamErrorCode,
    getExamErrorMessage,
    invalidateExam,
    useCurrentAttempt,
    useExam,
    useExamSlots,
    useExamQueue,
    useExamRegistrations,
    useExams,
} from "@/lib/exams";
import type { ExamConfiguration } from "@/types/exam";
import { toast } from "sonner";
import { ProjectTypeQuestionsEditor } from "@/features/exam/components/project-type-questions-editor";
import { ExamSettingsEditor } from "@/features/exam/components/exam-settings-editor";
import { queryKeys } from "@/lib/query-keys";
import { ProjectTypeQuestionsViewer } from "@/features/exam/components/project-type-questions-viewer";

const formatDate = (value: string | null | undefined) =>
    value
        ? new Date(value).toLocaleString("ru-RU", {
              dateStyle: "medium",
              timeStyle: "short",
          })
        : "Не задано";

const statusLabel: Record<string, string> = {
    draft: "Черновик",
    published: "Опубликован",
    waiting: "Ожидает",
    running: "Идёт защита",
    postponed: "Отложена",
    no_show: "Неявка",
    finished: "Завершена",
};

const defaultConfiguration = (): ExamConfiguration => ({
    title: "Новый экзамен",
    description: "",
    starts_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    connection_url: null,
    project_type_ids: [],
    registration_opens_at: null,
    registration_closes_at: null,
    weights: { teacher: 60, manager: 30, member: 10 },
    max_score: 25,
    presentation_minutes: 7,
    questions_minutes: 7,
    transition_minutes: 1,
    assessment_window_minutes: 3,
});

type FormErrors = Partial<
    Record<
        "title" | "description" | "starts_at" | "connection_url" | "project_type_ids" | "weights" | "max_score" | "durations",
        string
    >
>;

const validateConfiguration = (configuration: ExamConfiguration, forPublish = false): FormErrors => {
    const errors: FormErrors = {};
    if (!configuration.title.trim() || configuration.title.trim().length > 200) {
        errors.title = "Название обязательно и не должно превышать 200 символов";
    }
    if (configuration.description !== null && configuration.description.length > 5000) {
        errors.description = "Описание не должно превышать 5000 символов";
    }
    if (!configuration.starts_at || Number.isNaN(new Date(configuration.starts_at).getTime())) {
        errors.starts_at = "Укажите дату и время начала";
    }
    if (forPublish && configuration.project_type_ids.length === 0) {
        errors.project_type_ids = "Выберите хотя бы один тип проекта: без готовых вопросов экзамен нельзя опубликовать";
    }
    if (configuration.connection_url !== null) {
        try {
            const url = new URL(configuration.connection_url);
            if (!["http:", "https:"].includes(url.protocol)) throw new Error("unsupported protocol");
        } catch {
            errors.connection_url = "Ссылка должна быть корректным HTTP(S)-адресом";
        }
    }
    const weightTotal =
        configuration.weights.teacher + configuration.weights.manager + configuration.weights.member;
    if (weightTotal !== 100 || Object.values(configuration.weights).some((value) => value < 0 || value > 100)) {
        errors.weights = "Веса должны быть от 0 до 100 и в сумме составлять 100%";
    }
    if (Number(configuration.max_score) <= 0) errors.max_score = "Максимальный балл должен быть больше 0";
    if (
        configuration.presentation_minutes < 1 ||
        configuration.questions_minutes < 0 ||
        configuration.transition_minutes < 0 ||
        configuration.assessment_window_minutes < 1
    ) {
        errors.durations = "Проверьте длительности: выступление и окно оценивания больше 0";
    }
    return errors;
};

const localDate = (iso: string): Date => {
    const date = new Date(iso);
    return Number.isNaN(date.getTime()) ? new Date() : date;
};

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <section className="rounded-2xl border border-[--color-black-10] bg-app-surface p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-bold text-app-text">{title}</h2>
        {children}
    </section>
);

const ExamTimer = ({ seconds, status }: { seconds: number; status: string }) => {
    const [remaining, setRemaining] = useState(Math.max(0, seconds));
    useEffect(() => {
        setRemaining(Math.max(0, seconds));
        if (seconds <= 0) return undefined;
        const timer = window.setInterval(() => setRemaining((value) => Math.max(0, value - 1)), 1000);
        return () => window.clearInterval(timer);
    }, [seconds]);
    const danger = remaining <= 30;
    return (
        <div className={`flex size-36 flex-col items-center justify-center rounded-full border-8 ${danger ? "border-red-400 bg-red-50" : "border-blue-200 bg-blue-50"}`}>
            <span className={`text-2xl font-bold ${danger ? "text-red-700" : "text-blue-700"}`}>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</span>
            <span className="mt-1 text-xs text-app-muted">Таймер</span>
            <span className="text-xs font-medium text-app-text">{status}</span>
        </div>
    );
};

const ExamRoute = () => {
    const [params, setParams] = useSearchParams();
    const location = useLocation();
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const workspaceId = Number(params.get("workspaceId") || 0);
    const examId = Number(params.get("examId") || 0);
    const pageMode = location.pathname.endsWith("/conduct")
        ? "conduct"
        : location.pathname.endsWith("/view")
            ? "view"
            : "manage";
    const isManagementPage = pageMode === "manage";
    const isConductPage = pageMode === "conduct";
    const isOrganizer =
        user?.permissions?.includes("workspace:update") === true ||
        user?.permissions?.includes("role:update") === true;
    const [showCreate, setShowCreate] = useState(!examId);
    const [configuration, setConfiguration] = useState(defaultConfiguration);
    const [saving, setSaving] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [publishError, setPublishError] = useState("");
    const [showSettings, setShowSettings] = useState(false);
    const [slotStartsAt, setSlotStartsAt] = useState("");
    const [slotEndsAt, setSlotEndsAt] = useState("");
    const [selectedSlotId, setSelectedSlotId] = useState("");

    const exams = useExams(workspaceId);
    const spaces = useSpacesList({ page: 1, limit: 100 });
    const exam = useExam(workspaceId, examId);
    const registrations = useExamRegistrations(workspaceId, examId, !isOrganizer);
    const queue = useExamQueue(workspaceId, examId, Boolean(examId));
    const currentAttempt = useCurrentAttempt(workspaceId, examId, Boolean(examId));
    const slots = useExamSlots(workspaceId, examId);
    const projects = useProjectsList(String(workspaceId), { page: 1, limit: 100 });
    const projectTypes = useProjectTypes(workspaceId);

    const activeExam = exam.data;
    const workspaceName = spaces.data?.spaces.find((space) => space.id === workspaceId)?.title ?? `Пространство #${workspaceId}`;
    const projectNames = useMemo(
        () => new Map((projects.data?.items ?? []).map((project) => [project.id, project.name])),
        [projects.data],
    );

    const updateConfiguration = <K extends keyof ExamConfiguration>(key: K, value: ExamConfiguration[K]) =>
        setConfiguration((current) => ({ ...current, [key]: value }));

    const selectExam = (id: number) => {
        setParams({ workspaceId: String(workspaceId), examId: String(id) });
        setShowCreate(false);
    };

    const createExam = async () => {
        const errors = validateConfiguration(configuration);
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error("Проверьте поля экзамена");
            return;
        }
        setSaving(true);
        try {
            const created = await examApi.create(workspaceId, configuration);
            invalidateExam(queryClient, workspaceId, created.id);
            selectExam(created.id);
            toast.success("Экзамен создан");
        } catch (error) {
            toast.error(getExamErrorCode(error) === "questions_not_ready"
                ? "Для выбранных типов ещё не заполнены все вопросы уровней 1–5"
                : "Не удалось создать экзамен");
        } finally {
            setSaving(false);
        }
    };

    const publishExam = async () => {
        if (!activeExam) return;
        const errors = validateConfiguration(activeExam.configuration, true);
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error("Публикация невозможна: проверьте настройки экзамена");
            return;
        }
        setPublishError("");
        try {
            await examApi.publish(workspaceId, activeExam.id, activeExam.current_settings_version);
            invalidateExam(queryClient, workspaceId, activeExam.id);
            toast.success("Экзамен опубликован");
        } catch (error) {
            if (getExamErrorCode(error) === "questions_not_ready") {
                setPublishError("Публикация невозможна: для каждого выбранного типа проекта должны быть заполнены 5 критериев и уровни 1–5 с непустыми описаниями.");
            } else {
                toast.error("Не удалось опубликовать экзамен");
            }
        }
    };

    if (!workspaceId) {
        return (
            <ContentLayout title="Экзамены">
                <div className="mx-auto max-w-5xl p-8">
                    <p className="text-app-muted">Откройте экзамены из конкретного пространства.</p>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title="Экзамены">
            <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <Link to={`/app/space?id=${workspaceId}`} className="mb-2 inline-flex items-center gap-1 text-sm text-app-muted hover:text-app-text">
                            <ChevronLeft className="size-4" /> Вернуться в пространство
                        </Link>
                        <h1 className="text-3xl font-bold text-app-text">Экзамены пространства</h1>
                    </div>
                    {isOrganizer && (
                        <Button variant="blue" size="hug36" icon={<Plus />} onClick={() => setShowCreate(true)}>
                            Создать экзамен
                        </Button>
                    )}
                </div>

                {isManagementPage && showCreate && isOrganizer && (
                    <Section title="Создание экзамена">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <Label htmlFor="exam-title">Название</Label>
                                <Input id="exam-title" value={configuration.title} onChange={(event) => updateConfiguration("title", event.target.value)} aria-invalid={Boolean(formErrors.title)} />
                                {formErrors.title && <p className="mt-1 text-xs text-red-600">{formErrors.title}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <Label htmlFor="exam-description">Описание</Label>
                                <textarea id="exam-description" className="min-h-24 w-full rounded-md border bg-app-surface p-3 text-sm" value={configuration.description ?? ""} onChange={(event) => updateConfiguration("description", event.target.value)} />
                                {formErrors.description && <p className="mt-1 text-xs text-red-600">{formErrors.description}</p>}
                            </div>
                            <div>
                                <Label htmlFor="exam-starts">Начало</Label>
                                <div className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-1">
                                    <DatePicker value={localDate(configuration.starts_at)} onChange={(date) => {
                                        const current = localDate(configuration.starts_at);
                                        date.setHours(current.getHours(), current.getMinutes(), 0, 0);
                                        updateConfiguration("starts_at", date.toISOString());
                                    }} />
                                    <Input id="exam-starts-time" type="time" className="w-28 border-0" value={localDate(configuration.starts_at).toTimeString().slice(0, 5)} onChange={(event) => {
                                        const [hours, minutes] = event.target.value.split(":").map(Number);
                                        const date = localDate(configuration.starts_at);
                                        date.setHours(hours, minutes, 0, 0);
                                        updateConfiguration("starts_at", date.toISOString());
                                    }} />
                                </div>
                                {formErrors.starts_at && <p className="mt-1 text-xs text-red-600">{formErrors.starts_at}</p>}
                            </div>
                            <div>
                                <Label htmlFor="exam-url">Ссылка на подключение</Label>
                                <Input id="exam-url" type="url" placeholder="https://..." value={configuration.connection_url ?? ""} onChange={(event) => updateConfiguration("connection_url", event.target.value || null)} />
                                {formErrors.connection_url && <p className="mt-1 text-xs text-red-600">{formErrors.connection_url}</p>}
                            </div>
                            <div>
                                <Label htmlFor="exam-presentation">Выступление, минут</Label>
                                <Input id="exam-presentation" type="number" min={1} value={configuration.presentation_minutes} onChange={(event) => updateConfiguration("presentation_minutes", Number(event.target.value))} />
                            </div>
                            <div>
                                <Label htmlFor="exam-questions">Вопросы, минут</Label>
                                <Input id="exam-questions" type="number" min={0} value={configuration.questions_minutes} onChange={(event) => updateConfiguration("questions_minutes", Number(event.target.value))} />
                            </div>
                            <div>
                                <Label htmlFor="exam-window">Окно оценивания, минут</Label>
                                <Input id="exam-window" type="number" min={1} value={configuration.assessment_window_minutes} onChange={(event) => updateConfiguration("assessment_window_minutes", Number(event.target.value))} />
                            </div>
                            <div>
                                <Label htmlFor="exam-score">Максимальный балл</Label>
                                <Input id="exam-score" type="number" min={0.01} step="0.01" value={configuration.max_score} onChange={(event) => updateConfiguration("max_score", Number(event.target.value))} />
                            </div>
                            <div className="md:col-span-2">
                                <p className="mb-2 text-sm font-semibold text-app-text">Веса оценивания</p>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {(["teacher", "manager", "member"] as const).map((role) => (
                                        <label key={role} className="text-sm text-app-muted">
                                            {role}: <Input type="number" min={0} max={100} value={configuration.weights[role]} onChange={(event) => updateConfiguration("weights", { ...configuration.weights, [role]: Number(event.target.value) })} />
                                        </label>
                                    ))}
                                </div>
                                {formErrors.weights && <p className="mt-1 text-xs text-red-600">{formErrors.weights}</p>}
                            </div>
                            <div className="md:col-span-2">
                                <p className="mb-2 text-sm font-semibold text-app-text">Типы проектов</p>
                                <div className="flex flex-wrap gap-2">
                                    {projectTypes.data?.map((type) => {
                                        const selected = configuration.project_type_ids.includes(type.id);
                                        return (
                                            <button type="button" key={type.id} className={`rounded-full border px-3 py-1 text-sm ${selected ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-600"}`} onClick={() => updateConfiguration("project_type_ids", selected ? configuration.project_type_ids.filter((id) => id !== type.id) : [...configuration.project_type_ids, type.id])}>
                                                {type.name}
                                            </button>
                                        );
                                    })}
                                </div>
                                {formErrors.project_type_ids && <p className="mt-1 text-xs text-red-600">{formErrors.project_type_ids}</p>}
                            </div>
                        </div>
                        <div className="mt-5 flex justify-end">
                            <Button variant="blue" size="hug36" loading={saving} onClick={createExam}>Создать черновик</Button>
                        </div>
                    </Section>
                )}

                {isManagementPage && <Section title="Список экзаменов">
                    {exams.isLoading ? <Spinner /> : exams.data?.items.length ? (
                        <div className="grid gap-3 md:grid-cols-2">
                            {exams.data.items.map((item) => (
                                <button type="button" key={item.id} onClick={() => selectExam(item.id)} className={`rounded-xl border p-4 text-left transition hover:border-blue-400 ${item.id === examId ? "border-blue-500 bg-blue-50/50" : "border-gray-200"}`}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <h3 className="font-semibold text-app-text">{item.configuration.title}</h3>
                                            <p className="mt-1 text-sm text-app-muted"><CalendarClock className="mr-1 inline size-4" />{formatDate(item.configuration.starts_at)}</p>
                                        </div>
                                        <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{statusLabel[item.status]}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : <p className="text-app-muted">Экзаменов пока нет.</p>}
                </Section>}

                {activeExam && (
                    <>
                        <div className="space-y-3">
                            <nav className="flex flex-wrap items-center gap-2 text-sm text-app-muted">
                                <Link to="/app/spaces" className="hover:text-app-text">Все пространства</Link>
                                <span>/</span>
                                <Link to={`/app/space?id=${workspaceId}`} className="hover:text-app-text">{workspaceName}</Link>
                                <span>/</span>
                                <span className="text-app-text">{activeExam.configuration.title}</span>
                            </nav>
                            <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl bg-gray-100 p-6">
                                <div className="flex min-w-0 items-start gap-4">
                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm"><Building2 className="size-6" /></div>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-2xl font-bold text-app-text">{activeExam.configuration.title}</h1>
                                            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">{formatDate(activeExam.configuration.starts_at)}</span>
                                        </div>
                                        <p className="mt-1 text-sm text-app-muted">{activeExam.configuration.description || "Экзамен для студентов пространства"}</p>
                                        <p className="mt-4 text-xs text-gray-500">{workspaceName} · создан {formatDate(activeExam.created_at)}</p>
                                    </div>
                                </div>
                                {activeExam.configuration.connection_url ? <a className="inline-flex h-10 items-center gap-2 rounded-lg bg-gray-900 px-4 text-sm font-medium text-white hover:bg-gray-700" href={activeExam.configuration.connection_url} target="_blank" rel="noreferrer"><ExternalLink className="size-4" /> Подключиться</a> : <span className="rounded-lg bg-gray-200 px-4 py-2 text-sm text-gray-500">Ссылка не задана</span>}
                            </div>
                        </div>

                        <Section title="Описание экзамена">
                            <p className="text-app-muted">{activeExam.configuration.description || "Описание экзамена пока не добавлено."}</p>
                            <div className="mt-4 space-y-3">
                                {activeExam.configuration.project_type_ids.map((typeId) => {
                                    const type = projectTypes.data?.find((item) => item.id === typeId);
                                    return <ProjectTypeQuestionsViewer key={typeId} workspaceId={workspaceId} typeId={typeId} typeName={type?.name ?? `Тип проекта #${typeId}`} />;
                                })}
                                {!activeExam.configuration.project_type_ids.length && <p className="text-sm text-app-muted">Типы проектов не выбраны.</p>}
                            </div>
                        </Section>

                        {isManagementPage && <Section title={activeExam.configuration.title}>
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="space-y-1 text-sm text-app-muted">
                                    <p>{activeExam.configuration.description || "Описание не задано"}</p>
                                    <p>Начало: {formatDate(activeExam.configuration.starts_at)}</p>
                                    <p>Статус: <strong className="text-app-text">{statusLabel[activeExam.status]}</strong></p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {activeExam.configuration.connection_url && <a className="inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-sm" href={activeExam.configuration.connection_url} target="_blank" rel="noreferrer">Подключиться <ExternalLink className="size-4" /></a>}
                                            {isManagementPage && isOrganizer && <Button variant="outline" size="hug36" onClick={() => setShowSettings((value) => !value)}>{showSettings ? "Скрыть настройки" : "Изменить настройки"}</Button>}
                                            {isManagementPage && isOrganizer && activeExam.status === "draft" && <Button variant="blue" size="hug36" icon={<ShieldCheck />} onClick={publishExam}>Опубликовать</Button>}
                                            {activeExam.status === "published" && !isConductPage && <Link className="inline-flex h-9 items-center rounded-lg bg-gray-900 px-3 text-sm text-white" to={`/app/exams/conduct?workspaceId=${workspaceId}&examId=${activeExam.id}`}>Открыть проведение</Link>}
                                            {isConductPage && <Link className="inline-flex h-9 items-center rounded-lg border px-3 text-sm" to={`/app/exams/view?workspaceId=${workspaceId}&examId=${activeExam.id}`}>К просмотру экзамена</Link>}
                                        </div>
                                    </div>
                                    {publishError && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{publishError}</p>}
                                    {isManagementPage && showSettings && isOrganizer && <div className="mt-5 border-t border-gray-200 pt-5">
                                        <ExamSettingsEditor
                                            exam={activeExam}
                                            onSave={async (nextConfiguration, reason) => {
                                                try {
                                                    await examApi.replaceSettings(workspaceId, activeExam.id, {
                                                        expected_version: activeExam.current_settings_version,
                                                        reason,
                                                        configuration: nextConfiguration,
                                                    });
                                                    await invalidateExam(queryClient, workspaceId, activeExam.id);
                                                    toast.success("Настройки экзамена сохранены");
                                                } catch (error) {
                                                    toast.error(getExamErrorMessage(error) ?? "Не удалось сохранить настройки");
                                                    throw error;
                                                }
                                            }}
                                        />
                                    </div>}
                        </Section>}

                        <Section title="Вопросы и критерии">
                            <p className="mb-4 text-sm text-app-muted">
                                Для публикации у каждого выбранного типа проекта должен быть заполнен полный набор критериев
                                с уровнями 1–5. После начала первой оценки вопросы блокируются backend.
                            </p>
                            {isManagementPage && isOrganizer ? (
                                activeExam.configuration.project_type_ids.length ? (
                                    <div className="space-y-6">
                                        {activeExam.configuration.project_type_ids.map((typeId) => {
                                            const type = projectTypes.data?.find((item) => item.id === typeId);
                                            return (
                                                <div key={typeId} className="border-t border-gray-200 pt-5 first:border-t-0 first:pt-0">
                                                    <h3 className="mb-3 text-lg font-semibold text-app-text">{type?.name ?? `Тип проекта #${typeId}`}</h3>
                                                    <ProjectTypeQuestionsEditor workspaceId={workspaceId} typeId={typeId} typeName={type?.name ?? `Тип проекта #${typeId}`} />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : <p className="text-sm text-app-muted">Сначала выберите типы проектов в настройках экзамена.</p>
                            ) : activeExam.configuration.project_type_ids.length ? (
                                <div className="space-y-3">
                                    {activeExam.configuration.project_type_ids.map((typeId) => {
                                        const type = projectTypes.data?.find((item) => item.id === typeId);
                                        return <ProjectTypeQuestionsViewer key={typeId} workspaceId={workspaceId} typeId={typeId} typeName={type?.name ?? `Тип проекта #${typeId}`} />;
                                    })}
                                </div>
                            ) : <p className="text-sm text-app-muted">Типы проектов не выбраны.</p>}
                        </Section>

                        {(!isConductPage || isOrganizer) && (
                            <Section title="Слоты защиты">
                                <p className="mb-4 text-sm text-app-muted">
                                    Можно сформировать интервалы автоматически: от даты начала экзамена на 3 часа вперёд. После этого нажмите «Сохранить слоты».
                                </p>
                                {isManagementPage && <div className="mb-4 flex flex-wrap gap-2">
                                    <Button variant="outline" size="hug36" onClick={() => {
                                        const start = new Date(activeExam.configuration.starts_at);
                                        const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
                                        const toInput = (value: Date) => {
                                            const offset = value.getTimezoneOffset() * 60000;
                                            return new Date(value.getTime() - offset).toISOString().slice(0, 16);
                                        };
                                        setSlotStartsAt(toInput(start));
                                        setSlotEndsAt(toInput(end));
                                    }}>Предложить период 3 часа</Button>
                                    <span className="self-center text-xs text-app-muted">{formatDate(activeExam.configuration.starts_at)} — {formatDate(new Date(new Date(activeExam.configuration.starts_at).getTime() + 3 * 60 * 60 * 1000).toISOString())}</span>
                                </div>}
                                {isManagementPage && <div className="flex flex-wrap items-end gap-2">
                                    <label className="text-sm text-app-muted">Начало
                                        <Input type="datetime-local" value={slotStartsAt} onChange={(event) => setSlotStartsAt(event.target.value)} />
                                    </label>
                                    <label className="text-sm text-app-muted">Окончание
                                        <Input type="datetime-local" value={slotEndsAt} onChange={(event) => setSlotEndsAt(event.target.value)} />
                                    </label>
                                    <Button variant="outline" size="hug36" disabled={!slotStartsAt || !slotEndsAt} onClick={async () => {
                                        try {
                                            const start = new Date(slotStartsAt);
                                            const end = new Date(slotEndsAt);
                                            const interval = 15 * 60 * 1000;
                                            const generatedSlots: { starts_at: string; ends_at: string }[] = [];
                                            for (let cursor = start.getTime(); cursor < end.getTime(); cursor += interval) {
                                                const slotEnd = Math.min(cursor + interval, end.getTime());
                                                if (slotEnd > cursor) generatedSlots.push({
                                                    starts_at: new Date(cursor).toISOString(),
                                                    ends_at: new Date(slotEnd).toISOString(),
                                                });
                                            }
                                            await examApi.addSlots(workspaceId, activeExam.id, [
                                                ...generatedSlots,
                                            ]);
                                            await queryClient.invalidateQueries({ queryKey: queryKeys.exams.slots(workspaceId, activeExam.id) });
                                            setSlotStartsAt("");
                                            setSlotEndsAt("");
                                            toast.success("Слот добавлен");
                                        } catch (error) {
                                            toast.error(getExamErrorMessage(error) ?? "Не удалось добавить слот");
                                        }
                                    }}>Сохранить слоты</Button>
                                </div>}
                                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                    {slots.data?.items.map((slot) => (
                                        <div key={slot.id} className={`rounded-lg border p-3 text-sm ${slot.is_available ? "" : "opacity-50"}`}>
                                            <p>{formatDate(slot.starts_at)} — {formatDate(slot.ends_at)}</p>
                                            <p className="mt-1 text-xs text-app-muted">{slot.is_available ? "Свободен" : "Занят"}</p>
                                        </div>
                                    ))}
                                    {!slots.isLoading && !slots.data?.items.length && <p className="text-sm text-app-muted">Слоты не добавлены, запись идёт без выбора интервала.</p>}
                                </div>
                            </Section>
                        )}

                        <div className="grid gap-6 lg:grid-cols-2">
                            {currentAttempt.data?.attempt && (
                                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
                                    <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                                        <div className="rounded-xl bg-gray-50 p-4">
                                            <p className="text-xs uppercase tracking-wide text-app-muted">Проект, который защищается сейчас</p>
                                            <div className="mt-3 flex items-start gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 font-bold text-white">#{currentAttempt.data.attempt.project_id}</span>
                                                <div>
                                                    <p className="font-semibold text-app-text">{projectNames.get(currentAttempt.data.attempt.project_id) ?? `Проект #${currentAttempt.data.attempt.project_id}`}</p>
                                                    <p className="mt-1 text-sm text-app-muted">{projects.data?.items.find((item) => item.id === currentAttempt.data?.attempt?.project_id)?.description || "Описание проекта доступно участникам команды."}</p>
                                                    <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-app-muted"><Users className="size-4" /> Руководитель и участники команды</div>
                                                </div>
                                            </div>
                                        </div>
                                        <ExamTimer seconds={currentAttempt.data.attempt.remaining_seconds} status={currentAttempt.data.attempt.paused_at ? "Приостановлен" : statusLabel[currentAttempt.data.attempt.status]} />
                                    </div>
                                </div>
                            )}
                            {!isConductPage && <Section title="Записанные команды">
                                <div className="space-y-3">
                                    {registrations.isLoading ? <Spinner /> : registrations.data?.items.map((registration) => (
                                        <div key={registration.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-3">
                                            <div>
                                                <p className="font-medium text-app-text">{projectNames.get(registration.project_id) ?? `Проект #${registration.project_id}`}</p>
                                                <p className="text-xs text-app-muted">Запись #{registration.id} · версия {registration.version}</p>
                                            </div>
                                            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{statusLabel[registration.status]}</span>
                                        </div>
                                    ))}
                                    {!registrations.isLoading && !registrations.data?.items.length && <p className="text-sm text-app-muted">Записей пока нет.</p>}
                                </div>
                                <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-4">
                                    <p className="mb-3 text-sm font-semibold text-app-text">{isOrganizer ? "Назначить проект" : "Записать свой проект"}</p>
                                    {activeExam.status === "draft" && (
                                        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                                            Назначение доступно только после публикации экзамена.
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <select id="registration-project" disabled={activeExam.status !== "published"} className="h-10 min-w-0 flex-1 rounded-md border bg-app-surface px-3 text-sm disabled:cursor-not-allowed disabled:opacity-60">
                                            <option value="">Выберите проект</option>
                                            {projects.data?.items.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                                        </select>
                                        {slots.data?.items.some((slot) => slot.is_available) && (
                                            <select disabled={activeExam.status !== "published"} className="h-10 max-w-48 rounded-md border bg-app-surface px-2 text-sm" value={selectedSlotId} onChange={(event) => setSelectedSlotId(event.target.value)}>
                                                <option value="">Выберите слот</option>
                                                {slots.data.items.filter((slot) => slot.is_available).map((slot) => <option key={slot.id} value={slot.id}>{formatDate(slot.starts_at)}</option>)}
                                            </select>
                                        )}
                                        <Button variant="outline" size="hug36" disabled={activeExam.status !== "published"} onClick={async () => {
                                            const selected = document.getElementById("registration-project") as HTMLSelectElement | null;
                                            if (!selected?.value) return;
                                            try {
                                                await examApi.register(workspaceId, activeExam.id, { project_id: Number(selected.value), slot_id: selectedSlotId ? Number(selectedSlotId) : null }, !isOrganizer);
                                                invalidateExam(queryClient, workspaceId, activeExam.id);
                                                toast.success("Проект добавлен в экзамен");
                                            } catch (error) {
                                                toast.error(getExamErrorMessage(error) ?? "Не удалось добавить проект");
                                            }
                                        }}>Добавить</Button>
                                    </div>
                                </div>
                            </Section>}

                            <Section title="Очередь и проведение">
                                {queue.isLoading ? <Spinner /> : queue.data?.items.length ? (
                                    <div className="space-y-3">
                                        {queue.data.items.map((item) => (
                                            <div key={item.registration_id} className="rounded-xl border border-gray-200 p-3">
                                                <div className="flex items-center justify-between gap-3">
                                                    <p className="font-medium text-app-text">{projectNames.get(item.project_id) ?? `Проект #${item.project_id}`}</p>
                                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs">{statusLabel[item.state]}</span>
                                                </div>
                                                <p className="mt-1 text-xs text-app-muted">Позиция: {item.position ?? "не назначена"} · ETA: {item.position ? `${Math.ceil((queue.data.eta.items.find((eta) => eta.registration_id === item.registration_id)?.eta_seconds ?? 0) / 60)} мин.` : "—"}</p>
                                                {isOrganizer && item.state === "waiting" && (
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        <Button variant="blue" size="hug36" icon={<Play />} onClick={async () => {
                                                            try { await examApi.startAttempt(workspaceId, activeExam.id, item.registration_id, item.registration_version); invalidateExam(queryClient, workspaceId, activeExam.id); } catch { toast.error("Не удалось начать защиту"); }
                                                        }}>Начать</Button>
                                                        <Button variant="outline" size="hug36" onClick={async () => {
                                                            try { await examApi.postpone(workspaceId, activeExam.id, item.registration_id, item.registration_version, "Техническая задержка"); invalidateExam(queryClient, workspaceId, activeExam.id); } catch { toast.error("Не удалось отложить команду"); }
                                                        }}>Отложить</Button>
                                                        <Button variant="outline" size="hug36" onClick={async () => {
                                                            try { await examApi.noShow(workspaceId, activeExam.id, item.registration_id, item.registration_version, "Неявка"); invalidateExam(queryClient, workspaceId, activeExam.id); } catch { toast.error("Не удалось отметить неявку"); }
                                                        }}>Неявка</Button>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className="text-sm text-app-muted">Очередь пока пуста или недоступна.</p>}
                                {currentAttempt.data?.attempt && <AttemptControls workspaceId={workspaceId} examId={activeExam.id} attempt={currentAttempt.data.attempt} onChanged={() => invalidateExam(queryClient, workspaceId, activeExam.id)} />}
                            </Section>
                        </div>

                        <Section title="Участники и очередь">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[760px] text-left text-sm">
                                    <thead className="border-b text-xs uppercase text-app-muted"><tr><th className="p-3">№</th><th className="p-3">Проект</th><th className="p-3">Руководитель</th><th className="p-3">Команда</th><th className="p-3">Начало защиты</th><th className="p-3">Действия</th></tr></thead>
                                    <tbody>{queue.data?.items.map((item, index) => {
                                        const project = projects.data?.items.find((candidate) => candidate.id === item.project_id);
                                        return <tr key={item.registration_id} className="border-b last:border-0">
                                            <td className="p-3 font-medium">{index + 1}</td>
                                            <td className="p-3"><span className="font-medium text-blue-700">{project?.name ?? `Проект #${item.project_id}`}</span><p className="text-xs text-app-muted">{statusLabel[item.state]}</p></td>
                                            <td className="p-3">{project ? <span className="inline-flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-gray-200 text-xs">{project.author_id}</span>Автор проекта</span> : "—"}</td>
                                            <td className="p-3"><span className="inline-flex -space-x-2">{[1, 2, 3].map((person) => <span key={person} className="flex size-7 items-center justify-center rounded-full border-2 border-white bg-blue-100 text-xs">{person}</span>)}</span></td>
                                            <td className="p-3 text-app-muted">{item.planned_start_at ? formatDate(item.planned_start_at) : "—"}</td>
                                            <td className="p-3"><Button variant="outline" size="hug36" onClick={() => toast.info("Форма оценивания появится после подключения backend API оценок")}>Оценить</Button>{isOrganizer && <button type="button" className="ml-2 rounded-md p-2 text-app-muted hover:bg-gray-100" title="Действия" onClick={() => toast.info("Доступны действия в блоке очереди: начать, отложить, неявка")}><MoreHorizontal className="size-4" /></button>}</td>
                                        </tr>;
                                    })}</tbody>
                                </table>
                            </div>
                        </Section>

                        <Section title="Оценивание, результаты и выгрузка">
                            <div className="grid gap-3 md:grid-cols-3">
                                {["Рубрики и форма оценки", "Расчёт и итоговое решение", "Ведомость и участие (CSV)"].map((title) => (
                                    <div key={title} className="rounded-xl border border-dashed border-gray-300 p-4">
                                        <p className="font-semibold text-app-text">{title}</p>
                                        <p className="mt-1 text-sm text-app-muted">Backend-контракт ещё не подключён. UI оставлен заглушкой.</p>
                                        <Button className="mt-3" variant="ghost" size="hug36" disabled>Скоро</Button>
                                    </div>
                                ))}
                            </div>
                        </Section>
                    </>
                )}
            </div>
        </ContentLayout>
    );
};

const AttemptControls = ({ workspaceId, examId, attempt, onChanged }: { workspaceId: number; examId: number; attempt: import("@/types/exam").Attempt; onChanged: () => void }) => {
    const command = async (action: "questions" | "pause" | "resume" | "finish") => {
        try { await examApi.commandAttempt(workspaceId, examId, attempt.id, action, attempt.version); onChanged(); toast.success("Состояние защиты обновлено"); } catch { toast.error("Не удалось обновить состояние защиты"); }
    };
    return (
        <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="font-semibold text-app-text">Текущая защита · {statusLabel[attempt.status]}</p>
                    <p className="text-sm text-app-muted">Осталось: {Math.max(0, attempt.remaining_seconds)} сек.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {attempt.status === "speaking" && <Button variant="blue" size="hug36" onClick={() => command("questions")}>К вопросам</Button>}
                    {(attempt.status === "speaking" || attempt.status === "questions") && <Button variant="outline" size="hug36" onClick={() => command("pause")}>Пауза</Button>}
                    {attempt.paused_at && <Button variant="outline" size="hug36" onClick={() => command("resume")}>Продолжить</Button>}
                    {attempt.status === "questions" && <Button variant="blue" size="hug36" onClick={() => command("finish")}>Завершить</Button>}
                </div>
            </div>
        </div>
    );
};

export default ExamRoute;

import { isAxiosError } from "axios";
import { useId, useRef, useState } from "react";
import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner/spinner";
import {
    getExamErrorCode,
    getExamErrorMessage,
    questionApi,
    useProjectTypeQuestions,
} from "@/lib/exams";
import { queryKeys } from "@/lib/query-keys";
import type {
    ProjectTypeQuestion,
    ProjectTypeQuestions,
    QuestionLevel,
    QuestionScale,
    QuestionTemplate,
} from "@/types/exam";
import { toast } from "sonner";

type Props = {
    workspaceId: number;
    typeId: number;
    typeName: string;
    assessmentOpened?: boolean;
};

const scores = [1, 2, 3, 4, 5] as const;

const emptyQuestion = (maxScore: QuestionScale): ProjectTypeQuestion => ({
    id: 0,
    text: "",
    description: null,
    position: 0,
    levels: scores.slice(0, maxScore).map((score) => ({ score, description: "" })),
});

type SaveError = { message: string; questionIndex?: number };
type PendingChange =
    | { kind: "scale"; maxScore: QuestionScale; baseline?: ProjectTypeQuestions }
    | { kind: "template"; template: QuestionTemplate; expectedEtag?: string };

function getQuestionSaveErrors(error: unknown, questions: ProjectTypeQuestion[]): SaveError[] {
    const detail = isAxiosError<{ detail?: unknown }>(error) ? error.response?.data?.detail : null;
    const messages: SaveError[] = [];
    if (Array.isArray(detail)) {
        for (const issue of detail as unknown[]) {
            if (
                !issue ||
                typeof issue !== "object" ||
                !("loc" in issue) ||
                !Array.isArray(issue.loc)
            )
                continue;
            const [body, list, index, field, levelIndex] = issue.loc as unknown[];
            if (
                body !== "body" ||
                list !== "questions" ||
                typeof index !== "number" ||
                !Number.isInteger(index) ||
                !questions[index]
            )
                continue;

            let message = "Проверьте поля этого критерия.";
            if (field === "description") {
                message =
                    "type" in issue && issue.type === "string_too_long"
                        ? "Сократите описание до 2000 символов."
                        : "Введите описание или оставьте это поле пустым.";
            } else if (field === "text") {
                message = "Укажите название критерия длиной до 1000 символов.";
            } else if (field === "levels") {
                const score =
                    typeof levelIndex === "number"
                        ? questions[index].levels[levelIndex]?.score
                        : undefined;
                message = score
                    ? `Укажите описание уровня ${score} длиной от 1 до 4000 символов.`
                    : "Заполните описания всех уровней.";
            }
            messages.push({ questionIndex: index, message });
        }
        return messages.length
            ? messages
            : [{ message: "Проверьте поля критериев и повторите сохранение." }];
    }
    return [
        {
            message:
                getExamErrorMessage(error) ?? "Не удалось сохранить критерии. Попробуйте ещё раз.",
        },
    ];
}

export const ProjectTypeQuestionsEditor = ({
    workspaceId,
    typeId,
    typeName,
    assessmentOpened = false,
}: Props) => {
    const queryClient = useQueryClient();
    const questionsQuery = useProjectTypeQuestions(workspaceId, typeId);
    const [saveErrors, setSaveErrors] = useState<SaveError[]>([]);
    const [draftQuestions, setDraftQuestions] = useState<ProjectTypeQuestion[] | null>(null);
    const [draftScale, setDraftScale] = useState<QuestionScale | null>(null);
    const draftBaseline = useRef<ProjectTypeQuestions>();
    const [conflict, setConflict] = useState(false);
    const [loadingCriteria, setLoadingCriteria] = useState(false);
    const [pendingChange, setPendingChange] = useState<PendingChange | null>(null);
    const confirmationDescriptionId = useId();
    const lockKey = queryKeys.projectTypeQuestions.lock(workspaceId, typeId);
    const lock = useQuery<boolean>({ queryKey: lockKey, queryFn: skipToken, gcTime: Infinity });
    const locked = assessmentOpened || lock.data === true;
    const maxScore =
        (locked ? null : (draftScale ?? draftBaseline.current?.max_score)) ??
        questionsQuery.data?.max_score ??
        5;
    const questions = (locked ? null : draftQuestions) ?? questionsQuery.data?.questions ?? [];
    const hasCriteria = questions.length > 0 || Boolean(questionsQuery.data?.questions.length);

    const handleLock = (error: unknown) => {
        if (getExamErrorCode(error) !== "questions_locked") return false;
        queryClient.setQueryData(lockKey, true);
        return true;
    };
    const setQuestions = (
        update: (current: ProjectTypeQuestion[]) => ProjectTypeQuestion[],
        baseline = questionsQuery.data,
    ) => {
        setSaveErrors([]);
        const snapshot = (draftBaseline.current ??= baseline);
        setDraftQuestions((current) => update(current ?? snapshot?.questions ?? []));
    };
    const resetDraft = () => {
        draftBaseline.current = undefined;
        setDraftQuestions(null);
        setDraftScale(null);
    };
    const [templateCode, setTemplateCode] = useState<QuestionTemplate["code"]>();
    const [saving, setSaving] = useState(false);
    const [applying, setApplying] = useState(false);

    const templatesQuery = useQuery({
        queryKey: queryKeys.projectTypeQuestions.templates(),
        queryFn: questionApi.templates,
        enabled: !locked,
    });
    const templates =
        templatesQuery.data?.filter((template) => template.max_score === maxScore) ?? [];
    const selectedTemplate =
        templates.find((template) => template.code === templateCode) ?? templates[0];
    const busy = saving || applying || loadingCriteria || locked;
    const questionKey = queryKeys.projectTypeQuestions.detail(workspaceId, typeId);

    const changeScale = (nextScale: QuestionScale, baseline?: ProjectTypeQuestions) => {
        setDraftScale(nextScale);
        setQuestions(
            (current) =>
                current.map((question) => ({
                    ...question,
                    levels: scores.slice(0, nextScale).map(
                        (score) =>
                            question.levels.find((level) => level.score === score) ?? {
                                score,
                                description: "",
                            },
                    ),
                })),
            baseline,
        );
    };

    const requestScaleChange = (nextScale: QuestionScale) => {
        if (busy || maxScore === nextScale) return;
        if (hasCriteria)
            setPendingChange({ kind: "scale", maxScore: nextScale, baseline: questionsQuery.data });
        else changeScale(nextScale);
    };

    const updateQuestion = (index: number, patch: Partial<ProjectTypeQuestion>) => {
        setQuestions((current) =>
            current.map((question, item) =>
                item === index ? { ...question, ...patch } : question,
            ),
        );
    };

    const updateLevel = (questionIndex: number, score: number, description: string) => {
        setQuestions((current) =>
            current.map((question, index) =>
                index !== questionIndex
                    ? question
                    : {
                          ...question,
                          levels: question.levels.map((level) =>
                              level.score === score ? { ...level, description } : level,
                          ),
                      },
            ),
        );
    };

    const validate = () => {
        if (questions.length === 0) return "Добавьте хотя бы один критерий";
        if (
            questions.some(
                (question) => !question.text.trim() || question.text.trim().length > 1000,
            )
        ) {
            return "Текст каждого критерия обязателен и должен быть не длиннее 1000 символов";
        }
        if (questions.some((question) => (question.description?.trim().length ?? 0) > 2000)) {
            return "Описание критерия не должно превышать 2000 символов";
        }
        if (
            questions.some(
                (question) =>
                    question.levels.length !== maxScore ||
                    question.levels.some(
                        (level) =>
                            !level.description.trim() || level.description.trim().length > 4000,
                    ),
            )
        ) {
            return `Для каждого критерия заполните непустые описания уровней 1–${maxScore}`;
        }
        return null;
    };

    const loadLatestCriteria = async () => {
        if (busy) return;
        setLoadingCriteria(true);
        try {
            await queryClient.cancelQueries({ queryKey: questionKey });
            const latest = await questionApi.get(workspaceId, typeId);
            queryClient.setQueryData(questionKey, latest);
            resetDraft();
            setSaveErrors([]);
            setConflict(false);
        } catch {
            toast.error("Не удалось загрузить актуальные критерии. Попробуйте ещё раз.");
        } finally {
            setLoadingCriteria(false);
        }
    };

    const save = async () => {
        if (busy || conflict) return;
        setSaveErrors([]);
        const error = validate();
        if (error) {
            setSaveErrors([{ message: error }]);
            return;
        }
        setSaving(true);
        try {
            await queryClient.cancelQueries({ queryKey: questionKey });
            const baseline = draftBaseline.current ?? questionsQuery.data;
            const result = await questionApi.replace(
                workspaceId,
                typeId,
                questions,
                maxScore,
                baseline?.etag,
            );
            queryClient.setQueryData(questionKey, result);
            resetDraft();
            toast.success(`Критерии типа «${typeName}» сохранены`);
        } catch (requestError) {
            if (getExamErrorCode(requestError) === "questions_conflict") setConflict(true);
            else if (!handleLock(requestError))
                setSaveErrors(getQuestionSaveErrors(requestError, questions));
        } finally {
            setSaving(false);
        }
    };

    const applyTemplate = async (code: QuestionTemplate["code"], expectedEtag?: string) => {
        if (busy || conflict) return;
        setSaveErrors([]);
        setApplying(true);
        try {
            await queryClient.cancelQueries({ queryKey: questionKey });
            const result = await questionApi.applyTemplate(workspaceId, typeId, code, expectedEtag);
            queryClient.setQueryData(questionKey, result);
            resetDraft();
            toast.success("Шаблон вопросов применён");
        } catch (error) {
            if (getExamErrorCode(error) === "questions_conflict") setConflict(true);
            else if (!handleLock(error))
                toast.error(getExamErrorMessage(error) ?? "Не удалось применить шаблон");
        } finally {
            setApplying(false);
        }
    };

    const requestTemplate = () => {
        if (busy || conflict || !selectedTemplate) return;
        const expectedEtag = (draftBaseline.current ?? questionsQuery.data)?.etag;
        if (hasCriteria)
            setPendingChange({ kind: "template", template: selectedTemplate, expectedEtag });
        else void applyTemplate(selectedTemplate.code, expectedEtag);
    };

    const confirmChange = () => {
        if (busy || conflict || !pendingChange) return;
        setPendingChange(null);
        if (pendingChange.kind === "scale")
            changeScale(pendingChange.maxScore, pendingChange.baseline);
        else void applyTemplate(pendingChange.template.code, pendingChange.expectedEtag);
    };

    if (questionsQuery.isLoading) return <Spinner />;
    if (questionsQuery.isError)
        return (
            <p className="text-sm text-red-600 dark:text-red-300">
                Не удалось загрузить критерии этого типа проекта.
            </p>
        );

    return (
        <div className="space-y-4">
            {conflict && !locked && (
                <div
                    role="status"
                    className="space-y-2 rounded-xl border border-app-border p-4 text-[13px] text-app-text"
                >
                    <p>
                        Критерии изменились в другом окне. Загрузка актуальной версии сбросит ваши
                        несохранённые правки.
                    </p>
                    <Button
                        variant="outline"
                        size="hug36"
                        loading={loadingCriteria}
                        onClick={() => void loadLatestCriteria()}
                    >
                        Загрузить актуальные критерии
                    </Button>
                </div>
            )}
            {locked && (
                <div
                    role="status"
                    className="space-y-1 rounded-xl border border-gray-200 dark:border-app-border bg-gray-50 dark:bg-app-ghost p-4 text-[13px] text-app-text"
                >
                    <p className="font-semibold">Критерии закреплены</p>
                    <p>
                        На одном из экзаменов уже открыли оценивание проектов типа «{typeName}».
                        Критерии закреплены, чтобы сохранить правила, по которым оценивали команды.
                    </p>
                    <p>
                        Здесь можно посмотреть сохранённые критерии.
                        {draftQuestions && " Ваши правки не сохранились."}
                    </p>
                </div>
            )}
            <fieldset
                disabled={busy}
                className="space-y-4 [&_input:disabled]:bg-gray-100 dark:[&_input:disabled]:bg-app-ghost [&_textarea:disabled]:bg-gray-100 dark:[&_textarea:disabled]:bg-app-ghost"
            >
                <div className="flex flex-wrap items-end gap-2 rounded-xl bg-gray-50 dark:bg-app-ghost p-3">
                    <label className="text-sm text-app-muted">
                        Шкала оценивания
                        <select
                            aria-label="Шкала оценивания"
                            className="mt-1 block h-10 min-w-28 rounded-md border bg-app-surface px-3 text-sm text-app-text"
                            value={maxScore}
                            onChange={(event) =>
                                requestScaleChange(event.target.value === "3" ? 3 : 5)
                            }
                        >
                            <option value={3}>1–3</option>
                            <option value={5}>1–5</option>
                        </select>
                    </label>
                    {!locked && (
                        <>
                            <label className="min-w-52 flex-1 text-sm text-app-muted">
                                Готовый шаблон
                                <select
                                    className="mt-1 h-10 w-full rounded-md border bg-app-surface px-3 text-sm text-app-text"
                                    value={selectedTemplate?.code ?? ""}
                                    onChange={(event) =>
                                        setTemplateCode(
                                            event.target.value as QuestionTemplate["code"],
                                        )
                                    }
                                >
                                    {templates.map((template) => (
                                        <option key={template.code} value={template.code}>
                                            {template.name} · 1–{template.max_score}
                                        </option>
                                    ))}
                                    {!selectedTemplate && (
                                        <option value="">Шаблоны недоступны</option>
                                    )}
                                </select>
                            </label>
                            <Button
                                variant="outline"
                                size="hug36"
                                icon={<WandSparkles className="size-4" />}
                                loading={applying}
                                disabled={busy || conflict || !selectedTemplate}
                                onClick={requestTemplate}
                            >
                                {hasCriteria ? "Заменить вопросы шаблоном" : "Применить шаблон"}
                            </Button>
                        </>
                    )}
                </div>
                {questions.map((question, questionIndex) => (
                    <div
                        key={question.id || `new-${questionIndex}`}
                        className="rounded-xl border border-gray-200 dark:border-app-border p-4"
                    >
                        <div className="mb-3 flex items-start justify-between gap-2">
                            <p className="font-semibold text-app-text">
                                Критерий {questionIndex + 1}
                            </p>
                            {!locked && (
                                <button
                                    type="button"
                                    className="cursor-pointer text-app-muted hover:text-red-600 dark:hover:text-red-300"
                                    aria-label="Удалить критерий"
                                    onClick={() =>
                                        setQuestions((current) =>
                                            current.filter((_, index) => index !== questionIndex),
                                        )
                                    }
                                >
                                    <X className="size-4" />
                                </button>
                            )}
                        </div>
                        {saveErrors
                            .filter((error) => error.questionIndex === questionIndex)
                            .map(({ message }, index) => (
                                <p
                                    key={index}
                                    role="alert"
                                    className="mb-2 rounded-lg bg-[--error-bg] px-3 py-2 text-[13px] text-red-700 dark:text-red-200"
                                >
                                    {message}
                                </p>
                            ))}
                        <Input
                            value={question.text}
                            placeholder="Название критерия"
                            onChange={(event) =>
                                updateQuestion(questionIndex, { text: event.target.value })
                            }
                        />
                        <textarea
                            className="mt-2 min-h-16 w-full rounded-md border bg-app-surface p-2 text-sm"
                            placeholder="Что оценивается (необязательно)"
                            value={question.description ?? ""}
                            onChange={(event) =>
                                updateQuestion(questionIndex, { description: event.target.value })
                            }
                        />
                        <div
                            className={`mt-3 grid gap-2 ${maxScore === 3 ? "md:grid-cols-3" : "md:grid-cols-5"}`}
                        >
                            {question.levels.map((level: QuestionLevel) => (
                                <label key={level.score} className="text-xs text-app-muted">
                                    Уровень {level.score}
                                    <textarea
                                        className="mt-1 min-h-24 w-full rounded-md border bg-app-surface p-2 text-sm text-app-text"
                                        value={level.description}
                                        onChange={(event) =>
                                            updateLevel(
                                                questionIndex,
                                                level.score,
                                                event.target.value,
                                            )
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                    </div>
                ))}
                {saveErrors
                    .filter((error) => error.questionIndex === undefined)
                    .map(({ message }, index) => (
                        <p
                            key={index}
                            role="alert"
                            className="rounded-lg bg-[--error-bg] px-3 py-2 text-[13px] text-red-700 dark:text-red-200"
                        >
                            {message}
                        </p>
                    ))}
                {!locked && (
                    <div className="flex flex-wrap justify-between gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            icon={<Plus className="size-4" />}
                            onClick={() =>
                                setQuestions((current) => [
                                    ...current,
                                    { ...emptyQuestion(maxScore), position: current.length },
                                ])
                            }
                        >
                            Добавить критерий
                        </Button>
                        <Button
                            variant="blue"
                            size="hug36"
                            icon={<Save className="size-4" />}
                            loading={saving}
                            disabled={busy || conflict}
                            onClick={save}
                        >
                            Сохранить вопросы
                        </Button>
                    </div>
                )}
            </fieldset>
            <Dialog
                open={Boolean(pendingChange) && !locked}
                onOpenChange={(open) => {
                    if (!open) setPendingChange(null);
                }}
            >
                <DialogContent
                    aria-describedby={confirmationDescriptionId}
                    className="grid w-[calc(100%-2rem)] max-w-[440px] gap-4"
                >
                    <DialogHeader>
                        <DialogTitle>
                            {pendingChange?.kind === "scale"
                                ? `Изменить шкалу на 1–${pendingChange.maxScore}?`
                                : "Заменить критерии шаблоном?"}
                        </DialogTitle>
                    </DialogHeader>
                    <p id={confirmationDescriptionId} className="text-[13px] text-app-muted">
                        {pendingChange?.kind === "scale"
                            ? pendingChange.maxScore === 3
                                ? "Уровни 4 и 5 и их описания будут удалены из критериев после сохранения."
                                : "К каждому критерию добавятся уровни 4 и 5. Заполните их описания перед сохранением."
                            : `Шаблон «${pendingChange?.template.name ?? ""}» заменит все критерии этого типа проекта сразу, включая несохранённые правки.`}{" "}
                        Изменение затронет все экзамены с типом «{typeName}».
                    </p>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => setPendingChange(null)}
                        >
                            Отмена
                        </Button>
                        <Button variant="blue" size="hug36" onClick={confirmChange} disabled={busy}>
                            {pendingChange?.kind === "scale"
                                ? "Изменить шкалу"
                                : "Применить шаблон"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

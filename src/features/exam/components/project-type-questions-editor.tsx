import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Save, WandSparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner/spinner";
import { getExamErrorMessage, questionApi, useProjectTypeQuestions } from "@/lib/exams";
import { queryKeys } from "@/lib/query-keys";
import type { ProjectTypeQuestion, QuestionLevel, QuestionTemplate } from "@/types/exam";
import { toast } from "sonner";

type Props = {
    workspaceId: number;
    typeId: number;
    typeName: string;
};

const scores = [1, 2, 3, 4, 5] as const;

const emptyQuestion = (): ProjectTypeQuestion => ({
    id: 0,
    text: "",
    description: "",
    position: 0,
    levels: scores.map((score) => ({ score, description: "" })),
});

const cloneQuestions = (questions: ProjectTypeQuestion[]) =>
    questions.map((question) => ({
        ...question,
        levels: question.levels.map((level) => ({ ...level })),
    }));

export const ProjectTypeQuestionsEditor = ({ workspaceId, typeId, typeName }: Props) => {
    const queryClient = useQueryClient();
    const questionsQuery = useProjectTypeQuestions(workspaceId, typeId);
    const [questions, setQuestions] = useState<ProjectTypeQuestion[]>([]);
    const [templateCode, setTemplateCode] = useState<QuestionTemplate["code"]>("product");
    const [saving, setSaving] = useState(false);
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        if (questionsQuery.data) setQuestions(cloneQuestions(questionsQuery.data.questions));
    }, [questionsQuery.data]);

    const templatesQuery = useMemo(() => questionApi.templates(), []);
    const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
    useEffect(() => {
        templatesQuery.then(setTemplates).catch(() => undefined);
    }, [templatesQuery]);

    const updateQuestion = (index: number, patch: Partial<ProjectTypeQuestion>) => {
        setQuestions((current) => current.map((question, item) => item === index ? { ...question, ...patch } : question));
    };

    const updateLevel = (questionIndex: number, score: number, description: string) => {
        setQuestions((current) => current.map((question, index) => index !== questionIndex ? question : {
            ...question,
            levels: question.levels.map((level) => level.score === score ? { ...level, description } : level),
        }));
    };

    const validate = () => {
        if (questions.length === 0) return "Добавьте хотя бы один критерий";
        if (questions.some((question) => !question.text.trim() || question.text.length > 1000)) {
            return "Текст каждого критерия обязателен и должен быть не длиннее 1000 символов";
        }
        if (questions.some((question) => question.description && question.description.length > 2000)) {
            return "Описание критерия не должно превышать 2000 символов";
        }
        if (questions.some((question) => question.levels.length !== 5 || question.levels.some((level) => !level.description.trim() || level.description.length > 4000))) {
            return "Для каждого критерия заполните непустые описания уровней 1–5";
        }
        return null;
    };

    const save = async () => {
        const error = validate();
        if (error) {
            toast.error(error);
            return;
        }
        setSaving(true);
        try {
            await questionApi.replace(workspaceId, typeId, questions);
            await queryClient.invalidateQueries({ queryKey: queryKeys.projectTypeQuestions.detail(workspaceId, typeId) });
            toast.success(`Критерии типа «${typeName}» сохранены`);
        } catch (requestError) {
            toast.error(getExamErrorMessage(requestError) ?? "Не удалось сохранить критерии");
        } finally {
            setSaving(false);
        }
    };

    const applyTemplate = async () => {
        setApplying(true);
        try {
            await questionApi.applyTemplate(workspaceId, typeId, templateCode);
            await queryClient.invalidateQueries({ queryKey: queryKeys.projectTypeQuestions.detail(workspaceId, typeId) });
            toast.success("Шаблон вопросов применён");
        } catch {
            toast.error("Не удалось применить шаблон");
        } finally {
            setApplying(false);
        }
    };

    if (questionsQuery.isLoading) return <Spinner />;
    if (questionsQuery.isError) return <p className="text-sm text-red-600">Не удалось загрузить критерии этого типа проекта.</p>;

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap items-end gap-2 rounded-xl bg-gray-50 p-3">
                <label className="min-w-52 flex-1 text-sm text-app-muted">
                    Готовый шаблон
                    <select className="mt-1 h-10 w-full rounded-md border bg-app-surface px-3 text-sm text-app-text" value={templateCode} onChange={(event) => setTemplateCode(event.target.value as QuestionTemplate["code"])}>
                        {templates.length ? templates.map((template) => <option key={template.code} value={template.code}>{template.name}</option>) : (
                            <>
                                <option value="product">Продуктовый</option>
                                <option value="technical_integration">Технический/интеграционный</option>
                                <option value="research">Исследовательский</option>
                            </>
                        )}
                    </select>
                </label>
                <Button variant="outline" size="hug36" icon={<WandSparkles className="size-4" />} loading={applying} onClick={applyTemplate}>Применить шаблон</Button>
            </div>
            {questions.map((question, questionIndex) => (
                <div key={question.id || `new-${questionIndex}`} className="rounded-xl border border-gray-200 p-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                        <p className="font-semibold text-app-text">Критерий {questionIndex + 1}</p>
                        <button type="button" className="text-app-muted hover:text-red-600" aria-label="Удалить критерий" onClick={() => setQuestions((current) => current.filter((_, index) => index !== questionIndex))}><X className="size-4" /></button>
                    </div>
                    <Input value={question.text} placeholder="Название критерия" onChange={(event) => updateQuestion(questionIndex, { text: event.target.value })} />
                    <textarea className="mt-2 min-h-16 w-full rounded-md border bg-app-surface p-2 text-sm" placeholder="Что оценивается (необязательно)" value={question.description ?? ""} onChange={(event) => updateQuestion(questionIndex, { description: event.target.value })} />
                    <div className="mt-3 grid gap-2 md:grid-cols-5">
                        {question.levels.map((level: QuestionLevel) => (
                            <label key={level.score} className="text-xs text-app-muted">
                                Уровень {level.score}
                                <textarea className="mt-1 min-h-24 w-full rounded-md border bg-app-surface p-2 text-sm text-app-text" value={level.description} onChange={(event) => updateLevel(questionIndex, level.score, event.target.value)} />
                            </label>
                        ))}
                    </div>
                </div>
            ))}
            <div className="flex flex-wrap justify-between gap-2">
                <Button variant="outline" size="hug36" icon={<Plus className="size-4" />} onClick={() => setQuestions((current) => [...current, { ...emptyQuestion(), position: current.length }])}>Добавить критерий</Button>
                <Button variant="blue" size="hug36" icon={<Save className="size-4" />} loading={saving} onClick={save}>Сохранить вопросы</Button>
            </div>
        </div>
    );
};

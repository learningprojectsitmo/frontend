import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner/spinner";
import {
    useSpecification,
    useUpdateSpecification,
    useSpecificationComments,
    useAddSpecificationComment,
    useUpdateSpecificationComment,
    useDeleteSpecificationComment,
} from "@/lib/specification";
import { ApproveStageDialog, RejectStageDialog } from "@/features/project/components/stage-dialogs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUser } from "@/lib/auth";
import { MessageSquare, PencilLine, Plus, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { paths } from "@/config/paths";
import type { RequirementGroup, SpecificationComment, SpecificationStatus } from "@/types/api";
import { toast } from "sonner";

interface SpecificationTabProps {
    projectId: number;
    isAuthor: boolean;
    isTeacher: boolean;
    onAdvance: (projectId: number) => void;
    onApprove: (projectId: number) => void;
    onReject: (projectId: number, comment?: string | null) => void;
}

const STATUS_LABEL: Record<SpecificationStatus, { label: string; className: string }> = {
    draft: { label: "Черновик", className: "bg-[--orange-50]/10 text-[--orange-50]" },
    submitted: {
        label: "Отправлено на утверждение",
        className: "bg-[--azure-60]/10 text-[--azure-60]",
    },
    approved: { label: "Утверждено", className: "bg-[--green-39]/10 text-[--green-39]" },
};

function statusOf(data: { status: SpecificationStatus }): SpecificationStatus {
    return data.status;
}

function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function cleanGroups(groups: RequirementGroup[]): RequirementGroup[] {
    return groups
        .map((group) => ({
            name: group.name.trim(),
            requirements: group.requirements.map((r) => r.trim()).filter(Boolean),
        }))
        .filter((group) => group.name && group.requirements.length > 0);
}

export const SpecificationTab = ({
    projectId,
    isAuthor,
    isTeacher,
    onAdvance,
    onApprove,
    onReject,
}: SpecificationTabProps) => {
    const { data, isLoading, isError } = useSpecification(projectId);
    const updateMutation = useUpdateSpecification();

    const [goal, setGoal] = useState("");
    const [tasks, setTasks] = useState<string[]>([]);
    const [functional, setFunctional] = useState<RequirementGroup[]>([]);
    const [nonFunctional, setNonFunctional] = useState<RequirementGroup[]>([]);
    const [acceptance, setAcceptance] = useState<string[]>([]);
    const [isEditMode, setIsEditMode] = useState(false);

    useEffect(() => {
        if (!data) return;
        setGoal(data.goal ?? "");
        setTasks(data.tasks ?? []);
        setFunctional(data.functional_requirements ?? []);
        setNonFunctional(data.non_functional_requirements ?? []);
        setAcceptance(data.acceptance_criteria ?? []);
        setIsEditMode(false);
    }, [data]);

    const updateItem = (
        setter: React.Dispatch<React.SetStateAction<string[]>>,
        index: number,
        value: string,
    ) => {
        setter((items) => items.map((item, i) => (i === index ? value : item)));
    };

    const removeItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
        setter((items) => items.filter((_, i) => i !== index));
    };

    const addItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        setter((items) => [...items, ""]);
    };

    const handleSave = () => {
        updateMutation.mutate(
            {
                projectId,
                data: {
                    goal,
                    tasks: tasks.map((t) => t.trim()).filter(Boolean),
                    functional_requirements: cleanGroups(functional),
                    non_functional_requirements: cleanGroups(nonFunctional),
                    acceptance_criteria: acceptance.map((a) => a.trim()).filter(Boolean),
                },
            },
            {
                onSuccess: () => {
                    toast.success("Техническое задание сохранено");
                    setIsEditMode(false);
                },
                onError: () => toast.error("Не удалось сохранить техническое задание"),
            },
        );
    };

    if (isLoading) {
        return <Spinner className="mx-auto my-16" />;
    }

    if (isError || !data) {
        return (
            <section className="rounded-[14px] border border-[--color-black-10] bg-app-surface p-6 text-center text-sm text-app-muted">
                Не удалось загрузить техническое задание
            </section>
        );
    }

    const status = statusOf(data);
    const canEdit = isAuthor && status === "draft";
    const editing = canEdit && isEditMode;
    const hasFunctionalRequirement = functional.some((group) =>
        group.requirements.some((requirement) => requirement.trim()),
    );
    const filled =
        (goal.trim() && tasks.some((t) => t.trim()) && hasFunctionalRequirement) ||
        status !== "draft";

    return (
        <section className="flex flex-col gap-6">
            <div className="flex flex-col gap-6 rounded-[14px] border border-[--color-black-10] bg-app-surface p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <span
                            className={cn(
                                "inline-flex items-center rounded-full px-3 py-1 text-[12px] font-semibold",
                                STATUS_LABEL[status].className,
                            )}
                        >
                            {STATUS_LABEL[status].label}
                        </span>
                        {status === "draft" && data.rejection_comment && (
                            <span className="inline-flex items-center rounded-full bg-[--red-58]/10 px-3 py-1 text-[12px] font-medium text-[--red-58]">
                                Возвращено на доработку
                            </span>
                        )}
                    </div>
                    {isAuthor && status === "draft" && (
                        <div className="flex items-center gap-2">
                            {!isEditMode && (
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    onClick={() => setIsEditMode(true)}
                                >
                                    Редактировать
                                </Button>
                            )}
                            {editing && (
                                <>
                                    <Button
                                        variant="ghost"
                                        size="hug36"
                                        onClick={() => setIsEditMode(false)}
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        variant="dark"
                                        size="hug36"
                                        onClick={handleSave}
                                        disabled={updateMutation.isPending}
                                    >
                                        {updateMutation.isPending ? "Сохранение..." : "Сохранить"}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {editing ? (
                    <div className="flex flex-col gap-5">
                        <div className="flex flex-col gap-2">
                            <label className="font-sans text-sm font-semibold text-[--grey-4]">
                                Цель работы
                            </label>
                            <Textarea
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                rows={4}
                                placeholder="Опишите цель проекта..."
                                className="resize-y"
                            />
                        </div>

                        <ListEditor
                            title="Задачи"
                            hint="Что нужно сделать для достижения цели"
                            items={tasks}
                            onChange={(next) => setTasks(next)}
                            onUpdate={(i, v) => updateItem(setTasks, i, v)}
                            onRemove={(i) => removeItem(setTasks, i)}
                            onAdd={() => addItem(setTasks)}
                        />

                        <GroupedListEditor
                            title="Функциональные требования"
                            hint="Что система должна делать — сгруппируйте по ролям или модулям"
                            namePlaceholder="Роль или модуль (например, «Студент»)"
                            itemPlaceholder="Система должна..."
                            addGroupLabel="Добавить группу требований"
                            groups={functional}
                            onChange={(next) => setFunctional(next)}
                        />

                        <GroupedListEditor
                            title="Нефункциональные требования"
                            hint="Производительность, безопасность, надёжность, удобство, ограничения"
                            namePlaceholder="Категория (например, «Производительность»)"
                            itemPlaceholder="Система должна..."
                            addGroupLabel="Добавить категорию"
                            groups={nonFunctional}
                            onChange={(next) => setNonFunctional(next)}
                        />

                        <ListEditor
                            title="Критерии приёмки"
                            hint="По каким признакам результат будет считаться выполненным"
                            items={acceptance}
                            onChange={(next) => setAcceptance(next)}
                            onUpdate={(i, v) => updateItem(setAcceptance, i, v)}
                            onRemove={(i) => removeItem(setAcceptance, i)}
                            onAdd={() => addItem(setAcceptance)}
                        />

                        {isAuthor && (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    className="border-[--azure-58] text-[--azure-58] hover:bg-[--azure-54-15]"
                                    disabled={!filled}
                                    onClick={() => onAdvance(projectId)}
                                >
                                    Отправить на утверждение
                                </Button>
                                {!filled && (
                                    <span className="text-[13px] text-app-muted">
                                        Укажите цель, хотя бы одну задачу и одно функциональное
                                        требование
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {status === "draft" && data.rejection_comment && (
                            <div className="rounded-[12px] border border-[--red-58-40] bg-[--red-24] p-4 text-sm text-[--red-46]">
                                <span className="font-semibold">Комментарий преподавателя: </span>
                                {data.rejection_comment}
                            </div>
                        )}

                        <SpecBlock title="Цель работы" emptyLabel="Не указана" value={goal} />

                        <div className="flex flex-col gap-2">
                            <h3 className="font-sans text-base font-semibold text-[--grey-4]">
                                Задачи
                            </h3>
                            <BulletList items={tasks} emptyLabel="Задачи не указаны" />
                        </div>

                        <div className="flex flex-col gap-2">
                            <h3 className="font-sans text-base font-semibold text-[--grey-4]">
                                Функциональные требования
                            </h3>
                            <GroupedRequirementsView
                                groups={functional}
                                emptyLabel="Функциональные требования не указаны"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <h3 className="font-sans text-base font-semibold text-[--grey-4]">
                                Нефункциональные требования
                            </h3>
                            <GroupedRequirementsView
                                groups={nonFunctional}
                                emptyLabel="Нефункциональные требования не указаны"
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <h3 className="font-sans text-base font-semibold text-[--grey-4]">
                                Критерии приёмки
                            </h3>
                            <BulletList items={acceptance} emptyLabel="Критерии не указаны" />
                        </div>

                        {isAuthor && status === "draft" && (
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="outline"
                                    size="hug36"
                                    className="border-[--azure-58] text-[--azure-58] hover:bg-[--azure-54-15]"
                                    disabled={!filled}
                                    onClick={() => onAdvance(projectId)}
                                >
                                    Отправить на утверждение
                                </Button>
                                {!filled && (
                                    <span className="text-[13px] text-app-muted">
                                        Укажите цель, хотя бы одну задачу и одно функциональное
                                        требование
                                    </span>
                                )}
                            </div>
                        )}

                        {isTeacher && status === "submitted" && (
                            <div className="flex items-center gap-3">
                                <ApproveStageDialog
                                    stageName="Техническое задание"
                                    onConfirm={() => onApprove(projectId)}
                                />
                                <RejectStageDialog
                                    stageName="Техническое задание"
                                    onConfirm={(comment) => onReject(projectId, comment)}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <SpecificationComments
                projectId={projectId}
                canComment={isAuthor || isTeacher}
                canModerate={isAuthor || isTeacher}
            />
        </section>
    );
};

const SpecBlock = ({
    title,
    value,
    emptyLabel,
}: {
    title: string;
    value: string;
    emptyLabel: string;
}) => (
    <div className="flex flex-col gap-2">
        <h3 className="font-sans text-base font-semibold text-[--grey-4]">{title}</h3>
        <p className="text-[15px] leading-relaxed text-[--grey-4] whitespace-pre-wrap">
            {value || emptyLabel}
        </p>
    </div>
);

const BulletList = ({ items, emptyLabel }: { items: string[]; emptyLabel: string }) => {
    const populated = items.map((item) => item.trim()).filter(Boolean);
    if (populated.length === 0) {
        return <p className="text-sm text-app-muted">{emptyLabel}</p>;
    }
    return (
        <ul className="flex list-disc flex-col gap-1.5 pl-5">
            {populated.map((item, i) => (
                <li key={i} className="text-[15px] leading-relaxed text-[--grey-4]">
                    {item}
                </li>
            ))}
        </ul>
    );
};

const GroupedRequirementsView = ({
    groups,
    emptyLabel,
}: {
    groups: RequirementGroup[];
    emptyLabel: string;
}) => {
    const populated = groups.filter(
        (group) => group.name.trim() && group.requirements.some((r) => r.trim()),
    );
    if (populated.length === 0) {
        return <p className="text-sm text-app-muted">{emptyLabel}</p>;
    }
    return (
        <div className="flex flex-col gap-4">
            {populated.map((group, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                    <h4 className="font-sans text-sm font-semibold text-[--azure-46]">
                        {group.name}
                    </h4>
                    <ol className="flex list-decimal flex-col gap-1.5 pl-5">
                        {group.requirements
                            .map((r) => r.trim())
                            .filter(Boolean)
                            .map((requirement, j) => (
                                <li key={j} className="text-[15px] leading-relaxed text-[--grey-4]">
                                    {requirement}
                                </li>
                            ))}
                    </ol>
                </div>
            ))}
        </div>
    );
};

interface ListEditorProps {
    title: string;
    hint: string;
    items: string[];
    onChange: (next: string[]) => void;
    onUpdate: (index: number, value: string) => void;
    onRemove: (index: number) => void;
    onAdd: () => void;
}

const ListEditor = ({ title, hint, items, onUpdate, onRemove, onAdd }: ListEditorProps) => {
    return (
        <div className="flex flex-col gap-2">
            <label className="font-sans text-sm font-semibold text-[--grey-4]">{title}</label>
            <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Input
                            value={item}
                            onChange={(e) => onUpdate(i, e.target.value)}
                            placeholder={`${title} ${i + 1}`}
                            className="flex-1"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="hug36"
                            className="text-gray-400 hover:text-[--red-58]"
                            onClick={() => onRemove(i)}
                        >
                            <X size={16} />
                        </Button>
                    </div>
                ))}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="hug36"
                className="self-start gap-2 text-[13px] font-medium text-[--azure-58]"
                onClick={onAdd}
            >
                <Plus size={15} />
                Добавить {title.toLowerCase()}
            </Button>
            <span className="text-[12px] text-app-muted">{hint}</span>
        </div>
    );
};

interface GroupedListEditorProps {
    title: string;
    hint: string;
    namePlaceholder: string;
    itemPlaceholder: string;
    addGroupLabel: string;
    groups: RequirementGroup[];
    onChange: (next: RequirementGroup[]) => void;
}

const GroupedListEditor = ({
    title,
    hint,
    namePlaceholder,
    itemPlaceholder,
    addGroupLabel,
    groups,
    onChange,
}: GroupedListEditorProps) => {
    const updateGroupName = (gi: number, name: string) => {
        onChange(groups.map((group, i) => (i === gi ? { ...group, name } : group)));
    };
    const updateRequirement = (gi: number, ri: number, value: string) => {
        onChange(
            groups.map((group, i) =>
                i === gi
                    ? {
                          ...group,
                          requirements: group.requirements.map((r, j) => (j === ri ? value : r)),
                      }
                    : group,
            ),
        );
    };
    const addRequirement = (gi: number) => {
        onChange(
            groups.map((group, i) =>
                i === gi ? { ...group, requirements: [...group.requirements, ""] } : group,
            ),
        );
    };
    const removeRequirement = (gi: number, ri: number) => {
        onChange(
            groups.map((group, i) =>
                i === gi
                    ? { ...group, requirements: group.requirements.filter((_, j) => j !== ri) }
                    : group,
            ),
        );
    };
    const removeGroup = (gi: number) => {
        onChange(groups.filter((_, i) => i !== gi));
    };
    const addGroup = () => {
        onChange([...groups, { name: "", requirements: [""] }]);
    };

    return (
        <div className="flex flex-col gap-3">
            <label className="font-sans text-sm font-semibold text-[--grey-4]">{title}</label>
            {groups.map((group, gi) => (
                <div
                    key={gi}
                    className="flex flex-col gap-2 rounded-[12px] border border-[--color-black-10] bg-[--grey-98] p-3"
                >
                    <div className="flex items-center gap-2">
                        <Input
                            value={group.name}
                            onChange={(e) => updateGroupName(gi, e.target.value)}
                            placeholder={namePlaceholder}
                            className="flex-1 font-medium"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="hug36"
                            className="text-gray-400 hover:text-[--red-58]"
                            onClick={() => removeGroup(gi)}
                        >
                            <Trash2 size={15} />
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {group.requirements.map((requirement, ri) => (
                            <div key={ri} className="flex items-center gap-2">
                                <Input
                                    value={requirement}
                                    onChange={(e) => updateRequirement(gi, ri, e.target.value)}
                                    placeholder={itemPlaceholder}
                                    className="flex-1"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="hug36"
                                    className="text-gray-400 hover:text-[--red-58]"
                                    onClick={() => removeRequirement(gi, ri)}
                                >
                                    <X size={16} />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="hug36"
                        className="self-start gap-2 text-[13px] font-medium text-[--azure-58]"
                        onClick={() => addRequirement(gi)}
                    >
                        <Plus size={15} />
                        Добавить требование
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="ghost"
                size="hug36"
                className="self-start gap-2 text-[13px] font-medium text-[--azure-58]"
                onClick={addGroup}
            >
                <Plus size={15} />
                {addGroupLabel}
            </Button>
            <span className="text-[12px] text-app-muted">{hint}</span>
        </div>
    );
};

interface SpecificationCommentsProps {
    projectId: number;
    canComment: boolean;
    canModerate: boolean;
}

const SpecificationComments = ({
    projectId,
    canComment,
    canModerate,
}: SpecificationCommentsProps) => {
    const { data: currentUser } = useUser();
    const { data: comments = [], isLoading } = useSpecificationComments(projectId);
    const { mutate: addComment, isPending: commentPending } = useAddSpecificationComment(projectId);
    const { mutate: updateComment, isPending: updatePending } =
        useUpdateSpecificationComment(projectId);
    const { mutate: deleteComment, isPending: deletePending } =
        useDeleteSpecificationComment(projectId);

    const [commentText, setCommentText] = useState("");
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState("");
    const [deleteTarget, setDeleteTarget] = useState<SpecificationComment | null>(null);

    const handleAddComment = () => {
        if (!commentText.trim()) return;
        addComment(commentText.trim(), {
            onError: () => toast.error("Не удалось добавить комментарий"),
        });
        setCommentText("");
    };

    const handleStartEdit = (comment: SpecificationComment) => {
        setEditingId(comment.id);
        setEditText(comment.text);
    };

    const handleSaveEdit = (comment: SpecificationComment) => {
        if (!editText.trim()) return;
        updateComment(
            { commentId: comment.id, text: editText.trim() },
            {
                onSuccess: () => {
                    setEditingId(null);
                    setEditText("");
                },
                onError: () => toast.error("Не удалось обновить комментарий"),
            },
        );
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteComment(deleteTarget.id, {
            onSuccess: () => setDeleteTarget(null),
            onError: () => toast.error("Не удалось удалить комментарий"),
        });
    };

    return (
        <div className="flex flex-col gap-5 rounded-[14px] border border-[--color-black-10] bg-app-surface p-6">
            <h2 className="flex items-center gap-2 font-sans text-lg font-semibold text-[--grey-4]">
                <MessageSquare size={18} />
                Комментарии
                <span className="text-sm font-normal text-[--azure-46]">({comments.length})</span>
            </h2>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Spinner />
                </div>
            ) : comments.length === 0 ? (
                <p className="py-4 text-center text-sm text-[--azure-46]">
                    Комментариев пока нет. Будьте первым!
                </p>
            ) : (
                <div className="flex flex-col gap-4">
                    {comments.map((comment) => {
                        const isOwn = currentUser?.id === comment.author.id;
                        const canEdit = isOwn && editingId !== comment.id;
                        const canDelete = isOwn || canModerate;
                        const isEditing = editingId === comment.id;
                        return (
                            <div
                                key={comment.id}
                                className="flex gap-3 rounded-[12px] bg-[--grey-98] p-4"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[--azure-60]/20 text-xs font-semibold text-[--azure-60]">
                                    {comment.author.username.charAt(0).toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="mb-1 flex items-center gap-2">
                                        <Link
                                            to={paths.app.profile.getHref(comment.author.id)}
                                            className="text-sm font-semibold text-[--grey-4] hover:text-[--azure-60] transition-colors"
                                        >
                                            {comment.author.username}
                                        </Link>
                                        <span className="text-xs text-[--azure-46]">
                                            {comment.updated_at &&
                                            comment.updated_at !== comment.created_at
                                                ? `${formatDate(comment.updated_at)} (изменено)`
                                                : comment.created_at
                                                  ? formatDate(comment.created_at)
                                                  : ""}
                                        </span>
                                        <div className="ml-auto flex items-center gap-1">
                                            {canEdit && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleStartEdit(comment)}
                                                    className="rounded-lg p-2 text-[--azure-46] transition-colors hover:bg-[--azure-60]/10 hover:text-[--azure-60]"
                                                    title="Редактировать"
                                                >
                                                    <PencilLine size={15} />
                                                </button>
                                            )}
                                            {canDelete && (
                                                <button
                                                    type="button"
                                                    onClick={() => setDeleteTarget(comment)}
                                                    className="rounded-lg p-2 text-[--azure-46] transition-colors hover:bg-[--red-58]/10 hover:text-[--red-58]"
                                                    title="Удалить"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    {isEditing ? (
                                        <div className="flex flex-col gap-2">
                                            <Textarea
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                rows={3}
                                                autoFocus
                                            />
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="dark"
                                                    size="hug36"
                                                    onClick={() => handleSaveEdit(comment)}
                                                    disabled={!editText.trim() || updatePending}
                                                >
                                                    {updatePending ? "Сохранение..." : "Сохранить"}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="hug36"
                                                    onClick={() => {
                                                        setEditingId(null);
                                                        setEditText("");
                                                    }}
                                                >
                                                    Отмена
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm leading-relaxed text-[--grey-4] whitespace-pre-wrap">
                                            {comment.text}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {canComment && (
                <div className="flex gap-3">
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                            }
                        }}
                        placeholder="Напишите комментарий..."
                        className="h-11 flex-1 rounded-[12px] border border-[--color-black-10] bg-app-surface px-4 text-sm text-[--grey-4] outline-none transition-colors placeholder:text-[--azure-46] focus:border-[--azure-60] focus:ring-1 focus:ring-[--azure-60]/20"
                    />
                    <Button
                        variant="dark"
                        size="hug36"
                        onClick={handleAddComment}
                        disabled={!commentText.trim() || commentPending}
                        hasIcon
                        icon={<Send size={16} />}
                    />
                </div>
            )}

            <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Удалить комментарий?</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p className="text-sm text-gray-600">
                            Вы действительно хотите удалить комментарий автора{" "}
                            {deleteTarget ? `«${deleteTarget.author.username}»` : ""}? Это действие
                            нельзя будет отменить.
                        </p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="hug36"
                            onClick={() => setDeleteTarget(null)}
                        >
                            Отмена
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            disabled={deletePending}
                            onClick={handleDelete}
                        >
                            {deletePending ? "Удаление..." : "Удалить"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

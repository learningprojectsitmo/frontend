import { useEffect, useMemo, useState } from "react";
import { Globe, Lock, PencilLine, Plus, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button/icon-button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Spinner } from "@/components/ui/spinner/spinner";
import { paths } from "@/config/paths";
import { buildWikiTree } from "@/features/wiki/build-wiki-tree";
import { WikiTreeList } from "@/features/wiki/components/wiki-tree-list";
import { getApiErrorMessage } from "@/lib/api-client";
import { useUser } from "@/lib/auth";
import {
    useCreateWikiPage,
    useDeleteWikiPage,
    useUpdateWikiPage,
    useWikiPage,
    useWikiTree,
} from "@/lib/wiki";
import type { WikiPageSummary, WikiVisibility } from "@/types/api";

interface WikiTabProps {
    projectId: number;
    isAuthor: boolean;
    isTeacher: boolean;
}

/**
 * Вкладка вики внутри проекта.
 *
 * Права дублируют серверные (`isAuthor`/`isTeacher` из проекта), но это только
 * для отрисовки кнопок: реальную проверку всё равно делает бэкенд, поэтому
 * рассинхрон не приведёт к утечке — лишь к кнопке, которая вернёт 403.
 */
export const WikiTab = ({ projectId, isAuthor, isTeacher }: WikiTabProps) => {
    const { data: user } = useUser();
    // Публиковать и править чужие страницы может лид проекта или teacher/admin.
    const canModerate = isAuthor || isTeacher;

    const treeQuery = useWikiTree(projectId);
    const tree = useMemo(() => buildWikiTree(treeQuery.data ?? []), [treeQuery.data]);

    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [createOpen, setCreateOpen] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newParentId, setNewParentId] = useState<number | null>(null);
    const [newVisibility, setNewVisibility] = useState<WikiVisibility>("private");
    const [deleteTarget, setDeleteTarget] = useState<WikiPageSummary | null>(null);

    const pageQuery = useWikiPage(projectId, selectedId);
    const createMutation = useCreateWikiPage(projectId);
    const updateMutation = useUpdateWikiPage(projectId);
    const deleteMutation = useDeleteWikiPage(projectId);

    const page = pageQuery.data;

    // Сервер → локальное состояние редактора. isEditing сбрасывается, чтобы
    // правка не пережила переключение на другую страницу.
    useEffect(() => {
        if (!page) return;
        setTitle(page.title);
        setContent(page.content);
        setIsEditing(false);
    }, [page]);

    useEffect(() => {
        if (selectedId === null && tree.length > 0) {
            setSelectedId(tree[0].id);
        }
    }, [tree, selectedId]);

    const canEditPage = Boolean(
        page && canModerate && (page.author?.id === user?.id || isAuthor || isTeacher),
    );
    const canChangeVisibility = canModerate;

    if (treeQuery.isLoading) {
        return <Spinner className="mx-auto my-16" />;
    }

    if (treeQuery.isError) {
        return (
            <section className="rounded-[14px] border border-[--color-black-10] bg-app-surface p-6 text-center text-sm text-app-muted">
                Не удалось загрузить вики
            </section>
        );
    }

    const handleSave = () => {
        if (!page) return;
        if (!title.trim()) {
            toast.error("Заголовок не может быть пустым");
            return;
        }
        updateMutation.mutate(
            { pageId: page.id, data: { title: title.trim(), content } },
            {
                onSuccess: () => {
                    toast.success("Страница сохранена");
                    setIsEditing(false);
                },
                onError: (error) =>
                    toast.error(getApiErrorMessage(error, "Не удалось сохранить страницу вики")),
            },
        );
    };

    const handleToggleVisibility = () => {
        if (!page) return;
        const next: WikiVisibility = page.visibility === "public" ? "private" : "public";
        updateMutation.mutate(
            { pageId: page.id, data: { visibility: next } },
            {
                onSuccess: () =>
                    toast.success(next === "public" ? "Страница опубликована" : "Страница скрыта"),
                onError: (error) =>
                    toast.error(getApiErrorMessage(error, "Не удалось изменить видимость")),
            },
        );
    };

    const handleCreate = () => {
        if (!newTitle.trim()) {
            toast.error("Заголовок не может быть пустым");
            return;
        }
        createMutation.mutate(
            {
                title: newTitle.trim(),
                parent_id: newParentId,
                visibility: newVisibility,
            },
            {
                onSuccess: (created) => {
                    toast.success("Страница создана");
                    setCreateOpen(false);
                    setNewTitle("");
                    setNewParentId(null);
                    setNewVisibility("private");
                    setSelectedId(created.id);
                },
                onError: (error) =>
                    toast.error(getApiErrorMessage(error, "Не удалось создать страницу")),
            },
        );
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        deleteMutation.mutate(deleteTarget.id, {
            onSuccess: () => {
                toast.success("Страница удалена");
                setDeleteTarget(null);
                if (selectedId === deleteTarget.id) {
                    setSelectedId(null);
                }
            },
            onError: (error) =>
                toast.error(getApiErrorMessage(error, "Не удалось удалить страницу")),
        });
    };

    const handleCopyPublicLink = () => {
        if (!page) return;
        const url = `${window.location.origin}${paths.wiki.getHref(projectId, page.id)}`;
        navigator.clipboard
            .writeText(url)
            .then(() => toast.success("Ссылка скопирована"))
            .catch(() => toast.error("Не удалось скопировать ссылку"));
    };

    return (
        <section className="flex flex-col gap-6 rounded-[14px] border border-[--color-black-10] bg-app-surface p-6 sm:p-8">
            <header className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-gray-900">Wiki проекта</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="dark"
                        size="hug36"
                        icon={<Plus size={16} />}
                        onClick={() => setCreateOpen(true)}
                    >
                        Новая страница
                    </Button>
                </div>
            </header>

            <div className="flex flex-col gap-6 lg:flex-row">
                <aside className="w-full shrink-0 lg:w-[260px]">
                    {tree.length === 0 ? (
                        <p className="text-[13px] text-app-muted">Пока нет ни одной страницы</p>
                    ) : (
                        <WikiTreeList
                            nodes={tree}
                            activeId={selectedId}
                            onSelect={setSelectedId}
                            renderActions={
                                canModerate
                                    ? (node) => (
                                          <IconButton
                                              variant="ghost"
                                              icon={<Trash2 size={14} />}
                                              onClick={() => setDeleteTarget(node)}
                                              aria-label={`Удалить страницу ${node.title}`}
                                              className="opacity-0 transition-opacity group-hover:opacity-100"
                                          />
                                      )
                                    : undefined
                            }
                        />
                    )}
                </aside>

                <div className="min-w-0 flex-1">
                    {pageQuery.isLoading ? (
                        <Spinner className="mx-auto my-16" />
                    ) : !page ? (
                        <p className="text-[13px] text-app-muted">
                            Выберите страницу слева или создайте новую
                        </p>
                    ) : isEditing ? (
                        <div className="flex flex-col gap-4">
                            <Input
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Заголовок страницы"
                                maxLength={200}
                            />
                            <RichTextEditor value={content} onChange={setContent} />
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="ghost"
                                    size="hug36"
                                    onClick={() => {
                                        setTitle(page.title);
                                        setContent(page.content);
                                        setIsEditing(false);
                                    }}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    variant="dark"
                                    size="hug36"
                                    loading={updateMutation.isPending}
                                    onClick={handleSave}
                                >
                                    Сохранить
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {/* На мобильном кнопки уходят на свою строку: три
                                nowrap-контрола («Редактировать», «Опубликовать»,
                                шеринг) иначе не помещаются в одну линию с заголовком. */}
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 flex-1 flex-col gap-1">
                                    <h3 className="text-xl font-semibold text-gray-900">
                                        {page.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-[13px] text-app-muted">
                                        {page.author && <span>{page.author.username}</span>}
                                        <span className="flex items-center gap-1">
                                            {page.visibility === "public" ? (
                                                <Globe size={12} />
                                            ) : (
                                                <Lock size={12} />
                                            )}
                                            {page.visibility === "public"
                                                ? "Публичная"
                                                : "Приватная"}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    {canEditPage && (
                                        <Button
                                            variant="outline"
                                            size="hug36"
                                            icon={<PencilLine size={16} />}
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Редактировать
                                        </Button>
                                    )}
                                    {canChangeVisibility && (
                                        <Button
                                            variant="outline"
                                            size="hug36"
                                            icon={
                                                page.visibility === "public" ? (
                                                    <Lock size={16} />
                                                ) : (
                                                    <Globe size={16} />
                                                )
                                            }
                                            loading={updateMutation.isPending}
                                            onClick={handleToggleVisibility}
                                        >
                                            {page.visibility === "public"
                                                ? "Скрыть"
                                                : "Опубликовать"}
                                        </Button>
                                    )}
                                    {page.visibility === "public" && (
                                        <IconButton
                                            variant="default"
                                            icon={<Share2 size={16} />}
                                            onClick={handleCopyPublicLink}
                                            aria-label="Скопировать публичную ссылку"
                                        />
                                    )}
                                </div>
                            </div>
                            <RichTextViewer html={page.content} />
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <DialogHeader>
                        <DialogTitle>Новая страница вики</DialogTitle>
                    </DialogHeader>
                    <div className="mt-4 flex flex-col gap-3">
                        <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Заголовок страницы"
                            maxLength={200}
                        />
                        <label className="flex flex-col gap-1 text-[13px] text-app-muted">
                            Вложить в страницу
                            <select
                                value={newParentId ?? ""}
                                onChange={(e) =>
                                    setNewParentId(e.target.value ? Number(e.target.value) : null)
                                }
                                className="h-9 rounded-[8px] border border-app-border bg-app-surface px-2 text-[13px] text-gray-900"
                            >
                                <option value="">— без вложенности —</option>
                                {tree.map((node) => (
                                    <option key={node.id} value={node.id}>
                                        {node.title}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex items-center gap-2 text-[13px] text-app-muted">
                            <input
                                type="checkbox"
                                checked={newVisibility === "public"}
                                onChange={(e) =>
                                    setNewVisibility(e.target.checked ? "public" : "private")
                                }
                            />
                            Сразу опубликовать
                        </label>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="ghost" size="hug36" onClick={() => setCreateOpen(false)}>
                            Отмена
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            loading={createMutation.isPending}
                            onClick={handleCreate}
                        >
                            Создать
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
            >
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Удалить страницу «{deleteTarget?.title}»?</DialogTitle>
                    </DialogHeader>
                    <p className="mt-2 text-sm text-app-muted">
                        Вместе со страницей будут удалены все вложенные в неё.
                    </p>
                    <div className="mt-4 flex justify-end gap-2">
                        <Button variant="ghost" size="hug36" onClick={() => setDeleteTarget(null)}>
                            Отмена
                        </Button>
                        <Button
                            variant="dark"
                            size="hug36"
                            loading={deleteMutation.isPending}
                            onClick={handleDelete}
                        >
                            Удалить
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </section>
    );
};

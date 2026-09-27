import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";

import { Head } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { RichTextViewer } from "@/components/ui/rich-text-viewer";
import { Spinner } from "@/components/ui/spinner/spinner";
import { paths } from "@/config/paths";
import { getApiErrorMessage } from "@/lib/api-client";
import { useWikiPage, useWikiTree } from "@/lib/wiki";
import { buildWikiTree } from "@/features/wiki/build-wiki-tree";
import { WikiTreeList } from "@/features/wiki/components/wiki-tree-list";

interface WikiMessageProps {
    title: string;
    description?: string;
}

const WikiMessage = ({ title, description }: WikiMessageProps) => (
    <div className="mx-auto my-16 flex max-w-[420px] flex-col items-center gap-3 text-center">
        <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
        {description && <p className="text-sm text-app-muted">{description}</p>}
        <Button variant="dark" size="hug36" asChild>
            <Link to={paths.home.getHref()}>На главную</Link>
        </Button>
    </div>
);

const isNotFound = (error: unknown): boolean =>
    (error as { response?: { status?: number } })?.response?.status === 404;

/**
 * Публичный просмотр вики проекта.
 *
 * Живёт вне /app, поэтому аутентификации здесь нет вовсе: что видно посетителю,
 * решает бэкенд (приватная страница — 404, как и несуществующая). Клиентской
 * санитизации нет и не нужно — HTML уже очищен на сервере при сохранении.
 */
const PublicWikiRoute = () => {
    const { projectId } = useParams();
    const numericProjectId = Number(projectId);
    const [searchParams, setSearchParams] = useSearchParams();
    const requestedPageId = Number(searchParams.get("page")) || null;

    const treeQuery = useWikiTree(numericProjectId);
    const tree = useMemo(() => buildWikiTree(treeQuery.data ?? []), [treeQuery.data]);

    const [selectedId, setSelectedId] = useState<number | null>(requestedPageId);
    useEffect(() => {
        if (requestedPageId) {
            setSelectedId(requestedPageId);
        } else if (selectedId === null && tree.length > 0) {
            setSelectedId(tree[0].id);
        }
    }, [requestedPageId, tree, selectedId]);

    const pageQuery = useWikiPage(numericProjectId, selectedId);

    if (!numericProjectId) {
        return <WikiMessage title="Ссылка на вики некорректна" />;
    }

    if (treeQuery.isLoading) {
        return <Spinner className="mx-auto my-16" />;
    }

    if (treeQuery.isError) {
        return (
            <WikiMessage
                title="Не удалось загрузить вики"
                description={getApiErrorMessage(
                    treeQuery.error,
                    "Проверьте ссылку или попробуйте позже",
                )}
            />
        );
    }

    if (tree.length === 0) {
        return <WikiMessage title="В вики проекта пока нет публичных страниц" />;
    }

    const notFound = pageQuery.isError && isNotFound(pageQuery.error);

    return (
        <>
            <Head title="Wiki проекта" description="Публичные страницы вики проекта" />
            <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-4 py-10 lg:flex-row">
                <aside className="w-full shrink-0 lg:w-[260px]">
                    <div className="rounded-[14px] border border-[--color-black-10] bg-app-surface p-4">
                        <WikiTreeList
                            nodes={tree}
                            activeId={notFound ? null : selectedId}
                            onSelect={(pageId) => {
                                setSelectedId(pageId);
                                setSearchParams({ page: String(pageId) }, { replace: true });
                            }}
                        />
                    </div>
                </aside>

                <article className="min-w-0 flex-1">
                    {notFound ? (
                        <WikiMessage
                            title="Страница не найдена"
                            description="Возможно, она приватная или была удалена"
                        />
                    ) : pageQuery.isLoading ? (
                        <Spinner className="mx-auto my-16" />
                    ) : pageQuery.isError || !pageQuery.data ? (
                        <WikiMessage title="Не удалось загрузить страницу" />
                    ) : (
                        <div className="flex flex-col gap-4 rounded-[14px] border border-[--color-black-10] bg-app-surface p-6 sm:p-8">
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {pageQuery.data.title}
                            </h1>
                            {pageQuery.data.author && (
                                <p className="text-[13px] text-app-muted">
                                    {pageQuery.data.author.username}
                                </p>
                            )}
                            <RichTextViewer html={pageQuery.data.content} />
                        </div>
                    )}
                </article>
            </div>
        </>
    );
};

export default PublicWikiRoute;

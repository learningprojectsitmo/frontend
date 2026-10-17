import { useState, useEffect, useRef } from "react";
import { ContentLayout } from "@/components/layouts";
import { useSearchParams, Link, useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
    useResumeDetail,
    useUpdateResume,
    useCreateResume,
    useDeleteResume,
    getResumeDetail,
    deleteResume,
    shareResume,
    invalidateWorkspaceResumes,
} from "@/lib/resume";
import { useProfile } from "@/lib/profile";
import { useSpacesList } from "@/lib/spaces";
import { Spinner } from "@/components/ui/spinner/spinner";
import { queryKeys } from "@/lib/query-keys";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
import { ResumePage, type ResumeFormFields } from "@/features/resume/components/resume-page";
import { ConfirmDeleteResumeDialog } from "@/features/resume/components/confirm-delete-resume-dialog";
import { paths } from "@/config/paths";
import { toast } from "sonner";
import type { ResumeDetail, ResumeUserInfo } from "@/types/api";

const ResumeRoute = () => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const rawId = searchParams.get("id");
    const id = parseInt(rawId || "0", 10);
    const isCreateMode = !rawId || id === 0;
    const projectId = searchParams.get("projectId");
    const workspaceIdParam = searchParams.get("workspaceId");
    const workspaceId = workspaceIdParam ? parseInt(workspaceIdParam, 10) : null;

    // Авто-созданный по первому клику «+ Добавить» черновик: живёт в state,
    // URL не меняется до явного «Сохранить». draftRef.saved=true — резюме
    // больше не черновик (сохранён вручную), удалять при уходе нельзя.
    const [createdId, setCreatedId] = useState(0);
    const draftRef = useRef({ id: 0, saved: false });

    const { data, isLoading, error } = useResumeDetail(createdId || id);
    const { data: profile } = useProfile();
    const { data: dataSpaces } = useSpacesList();
    const updateResumeMutation = useUpdateResume();
    const createResumeMutation = useCreateResume();
    const deleteResumeMutation = useDeleteResume();

    const [isEditing, setIsEditing] = useState(isCreateMode);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const canEditSections = isEditing;

    // Уход со страницы без явного «Сохранить» (хлебные крошки, «назад»,
    // любая навигация) — черновик подчищается. «Отмена» сбрасывает draftRef
    // до вызова navigate, поэтому двойного DELETE не будет.
    useEffect(() => {
        return () => {
            const draft = draftRef.current;
            if (draft.id > 0 && !draft.saved) {
                void deleteResume(draft.id).catch(() => {});
            }
        };
    }, []);

    // При переходе create → просмотр (после сохранения нового резюме) React Router
    // переиспользует ту же инстанцию роута: isEditing оставался true, и страница
    // показывалась в режиме редактирования. Синхронизируем режим с флагом создания.
    useEffect(() => {
        setIsEditing(isCreateMode);
    }, [isCreateMode]);

    // При открытии резюме сбрасываем кеш: деталка резюме, профиль (списки резюме
    // на странице профиля) и списки резюме в пространствах — чтобы данные были свежими.
    useEffect(() => {
        if (isCreateMode) return;
        void queryClient.invalidateQueries({ queryKey: queryKeys.resume.detail(id) });
        void queryClient.invalidateQueries({ queryKey: queryKeys.profile.detail() });
        invalidateWorkspaceResumes(queryClient);
    }, [id, isCreateMode, queryClient]);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        if (isCreateMode) {
            const draft = draftRef.current;
            if (draft.id > 0 && !draft.saved) {
                draftRef.current = { id: 0, saved: true };
                void deleteResume(draft.id)
                    .then(() => toast.success("Черновик удалён"))
                    .catch(() => {});
            }
            navigate("/app/profile");
        } else {
            setIsEditing(false);
        }
    };

    const handleShare = () => {
        void shareResume(id);
    };

    const handleDelete = () => {
        setIsDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        await deleteResumeMutation.mutateAsync(id);
        setIsDeleteDialogOpen(false);
        navigate("/app/profile");
    };

    const handleSave = async (fields: ResumeFormFields) => {
        if (isCreateMode) {
            if (!fields.header.trim()) {
                toast.error("Введите название резюме");
                return;
            }
            if (createdId > 0) {
                await updateResumeMutation.mutateAsync({ id: createdId, data: fields });
                draftRef.current.saved = true;
                setIsEditing(false);
                navigate(paths.app.resume.getHref(createdId, null, workspaceId));
                return;
            }
            const resume = await createResumeMutation.mutateAsync({
                header: fields.header,
                role: fields.role,
                about: fields.about,
                cover_letter: fields.cover_letter,
                has_experience: fields.has_experience,
                no_experience_description: fields.no_experience_description,
                is_visible: fields.is_visible,
                spaces: fields.spaces,
            });
            draftRef.current = { id: resume.id, saved: true };
            setIsEditing(false);
            navigate(paths.app.resume.getHref(resume.id, null, workspaceId));
        } else {
            if (!fields.header.trim()) {
                toast.error("Введите название резюме");
                return;
            }
            await updateResumeMutation.mutateAsync({ id, data: fields });
            setIsEditing(false);
        }
    };

    // Первый клик «+ Добавить» в режиме создания: создаём резюме по текущим
    // значениям формы и возвращаем его id, чтобы карточка открыла форму
    // добавления. Ошибка создания (включая пустой заголовок) → null.
    const handleEnsureResume = async (fields: ResumeFormFields): Promise<number | null> => {
        if (!isCreateMode) return id;
        if (createdId > 0) return createdId;
        try {
            const resume = await createResumeMutation.mutateAsync({
                header: fields.header,
                role: fields.role,
                about: fields.about,
                cover_letter: fields.cover_letter,
                has_experience: fields.has_experience,
                no_experience_description: fields.no_experience_description,
                is_visible: fields.is_visible,
                spaces: fields.spaces,
            });
            draftRef.current = { id: resume.id, saved: false };
            setCreatedId(resume.id);
            // Кладём реальный detail в кеш: карточки сразу получают валидные id
            // секций, скопированных бэкендом из профиля. При сбое фоновый
            // refetch из useResumeDetail доделает.
            void queryClient
                .fetchQuery({
                    queryKey: queryKeys.resume.detail(resume.id),
                    queryFn: () => getResumeDetail(resume.id),
                })
                .catch(() => {});
            return resume.id;
        } catch {
            return null;
        }
    };

    if (isCreateMode) {
        const profileUser: ResumeUserInfo = {
            id: profile?.id ?? 0,
            first_name: profile?.first_name ?? "",
            last_name: profile?.last_name ?? null,
            middle_name: profile?.middle_name ?? "",
            email: profile?.email ?? null,
            phone: profile?.phone ?? null,
            tg_nickname: profile?.tg_nickname ?? null,
            vk_nickname: profile?.vk_nickname ?? null,
            role: profile?.role ?? null,
        };

        const emptyDetail: ResumeDetail = {
            resume: {
                id: 0,
                header: "",
                author_id: profile?.id ?? 0,
                resume_text: null,
                role: null,
                about: null,
                cover_letter: null,
                has_experience: true,
                no_experience_description: null,
                is_visible: false,
                views_count: 0,
                invitations_count: 0,
                spaces: workspaceId
                    ? [{ workspace_id: workspaceId, workspace_name: "", is_default: false }]
                    : [],
                created_at: "",
                updated_at: "",
            },
            user: profileUser,
            experiences: [],
            skills: [],
            interests: [],
            links: (profile?.portfolio ?? []).map((item) => ({
                id: 0,
                platform: item.title,
                url: item.url,
                sort_order: 0,
            })),
            educations: (profile?.education ?? []).map((item) => ({
                id: 0,
                institution: item.institution,
                faculty: item.faculty ?? null,
                degree: item.degree ?? null,
                years: item.years ?? null,
                sort_order: 0,
            })),
            languages: (profile?.languages ?? []).map((item) => ({
                id: 0,
                name: item.name,
                level: item.level ?? null,
                sort_order: 0,
            })),
        };

        // После авто-создания показываем реальный detail (с валидными id
        // скопированных секций); до этого — пустышку с id=0.
        const renderDetail: ResumeDetail =
            createdId > 0
                ? (data ?? {
                      ...emptyDetail,
                      resume: { ...emptyDetail.resume, id: createdId },
                  })
                : emptyDetail;

        return (
            <ContentLayout title="Новое резюме">
                <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 flex flex-col gap-6">
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link
                                        to="/app"
                                        className="font-sans font-medium text-sm sm:text-base"
                                    >
                                        Все пространства
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbLink asChild>
                                    <Link
                                        to="/app/profile"
                                        className="font-sans font-medium text-sm sm:text-base"
                                    >
                                        Профиль
                                    </Link>
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                <BreadcrumbPage className="font-sans font-medium text-sm sm:text-base">
                                    Новое резюме
                                </BreadcrumbPage>
                            </BreadcrumbItem>
                        </BreadcrumbList>
                    </Breadcrumb>

                    <ResumePage
                        data={renderDetail}
                        availableSpaces={dataSpaces?.spaces ?? []}
                        isEditing={isEditing}
                        sectionsEditable={canEditSections}
                        onEdit={handleEdit}
                        onSave={handleSave}
                        onEnsureResume={handleEnsureResume}
                        onCancel={handleCancel}
                    />
                </div>
            </ContentLayout>
        );
    }

    if (isLoading) {
        return (
            <ContentLayout title="Резюме">
                <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
                    <Spinner size="lg" />
                </div>
            </ContentLayout>
        );
    }

    if (error || !data) {
        return (
            <ContentLayout title="Резюме не найдено">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-lg">Резюме не найдено</p>
                </div>
            </ContentLayout>
        );
    }

    const isOwner = profile?.id === data.resume.author_id;
    const fullName = [data.user.last_name, data.user.first_name, data.user.middle_name]
        .filter(Boolean)
        .join(" ");
    const resumeTitle = data.resume.header || fullName;

    const workspace = workspaceId ? dataSpaces?.spaces.find((s) => s.id === workspaceId) : null;

    return (
        <ContentLayout title={`Резюме — ${resumeTitle}`}>
            <div className="mx-auto max-w-[1200px] px-4 sm:px-6 py-6 flex flex-col gap-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link
                                    to="/app"
                                    className="font-sans font-medium text-sm sm:text-base"
                                >
                                    Все пространства
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {workspace ? (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            to={`/app/space?id=${workspace.id}`}
                                            className="font-sans font-medium text-sm sm:text-base"
                                        >
                                            {workspace.title}
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        ) : projectId ? (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            to={`/app/project?id=${projectId}`}
                                            className="font-sans font-medium text-sm sm:text-base"
                                        >
                                            Проект
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        ) : (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            to="/app/profile"
                                            className="font-sans font-medium text-sm sm:text-base"
                                        >
                                            Профиль
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        )}
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-sm sm:text-base">
                                Резюме — {resumeTitle}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <ResumePage
                    data={data}
                    availableSpaces={dataSpaces?.spaces ?? []}
                    isEditing={isEditing}
                    sectionsEditable={canEditSections}
                    onEdit={isOwner ? handleEdit : undefined}
                    onSave={isOwner ? handleSave : undefined}
                    onCancel={isOwner ? handleCancel : undefined}
                    onShare={isOwner ? handleShare : undefined}
                    onDelete={isOwner ? handleDelete : undefined}
                />

                {isOwner && (
                    <ConfirmDeleteResumeDialog
                        open={isDeleteDialogOpen}
                        onOpenChange={setIsDeleteDialogOpen}
                        resumeTitle={resumeTitle}
                        onDelete={handleConfirmDelete}
                        isPending={deleteResumeMutation.isPending}
                    />
                )}
            </div>
        </ContentLayout>
    );
};

export default ResumeRoute;

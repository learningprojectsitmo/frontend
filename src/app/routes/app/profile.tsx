import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { ProfileHeader, ResumeList, AdditionalSection } from "@/features/profile/components";
import { ProfileEditForm } from "@/features/profile/components/profile-edit-form";
import { mapResumeFromApi, type ResumeData } from "@/features/profile/components/resume-card";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useProfile } from "@/lib/profile";
import { useUpdateResume, useDeleteResume, useSetDefaultResume, shareResume } from "@/lib/resume";
import { paths } from "@/config/paths";
import { ResponsesSection } from "@/features/profile/components/responses-section";
import { InvitationsSection } from "@/features/profile/components/invitations-section";
import {
    useResponses,
    useInvitations,
    usePublicProfile,
} from "@/features/profile/api/use-profile-data";
import { SpacesSection } from "@/features/profile/components/spaces-section";
import { ProjectsSection } from "@/features/profile/components/projects-section";
import { ProfileActivity } from "@/features/profile/components/profile-activity";
import { ConfirmDeleteResumeDialog } from "@/features/resume/components/confirm-delete-resume-dialog";
const baseMainTabs = [
    { value: "resume", label: "Резюме" },
    { value: "responses", label: "Отклики и приглашения" },
    { value: "spaces", label: "Пространства и проекты" },
];

const otherUserTabs = baseMainTabs.filter((tab) => tab.value !== "responses");

const socialsFromProfile = (
    tg: string | null,
    vk: string | null,
): { label: string; value: string }[] => {
    const result: { label: string; value: string }[] = [];
    if (tg) result.push({ label: "Telegram", value: tg });
    if (vk) result.push({ label: "VK", value: vk });
    return result;
};

const ProfileRoute = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "resume");
    const { data: profile } = useProfile();
    const profileIdParam = searchParams.get("id");
    const isOtherUser =
        !!profileIdParam && profile != null && Number(profileIdParam) !== profile.id;
    const otherUserId = isOtherUser ? Number(profileIdParam) : null;
    const { data: otherProfile } = usePublicProfile(otherUserId ?? 0, { enabled: isOtherUser });
    const { data: responses } = useResponses();
    const { data: invitations } = useInvitations();
    const deleteResumeMutation = useDeleteResume();
    const updateResumeMutation = useUpdateResume();
    const setDefaultResumeMutation = useSetDefaultResume();
    const [editing, setEditing] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<ResumeData | null>(null);

    const visibleProfile = isOtherUser ? otherProfile : profile;

    const pendingCount =
        (invitations?.filter((i) => i.status === "pending").length ?? 0) +
        (responses?.filter((r) => r.status === "accepted").length ?? 0);

    const mainTabs = (isOtherUser ? otherUserTabs : baseMainTabs).map((tab) =>
        !isOtherUser && tab.value === "responses" && pendingCount > 0
            ? { ...tab, label: `${tab.label} (${pendingCount})` }
            : tab,
    );

    const resumes = (visibleProfile?.resumes ?? []).map(mapResumeFromApi);

    const handleShare = (id: number) => {
        void shareResume(id);
    };

    const handleToggleVisibility = (id: number) => {
        const r = resumes.find((item) => item.id === id);
        if (!r) return;
        updateResumeMutation.mutate({ id, data: { is_visible: !r.isVisible } });
    };

    const handleSetDefault = (id: number) => {
        setDefaultResumeMutation.mutate(id);
    };

    const handleDeleteClick = (id: number) => {
        setDeleteTarget(resumes.find((r) => r.id === id) ?? null);
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) return;
        await deleteResumeMutation.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setSearchParams(value === "resume" ? {} : { tab: value }, { replace: true });
    };

    return (
        <ContentLayout title="Профиль и Резюме">
            <div className="mx-auto max-w-5xl p-4 sm:p-6 flex flex-col gap-5">
                {isOtherUser ? (
                    <ProfileHeader
                        firstName={visibleProfile?.first_name ?? ""}
                        middleName={visibleProfile?.middle_name ?? ""}
                        lastName={visibleProfile?.last_name ?? ""}
                        role={visibleProfile?.role ?? ""}
                        phone={visibleProfile?.phone ?? ""}
                        email={visibleProfile?.email ?? ""}
                        socials={socialsFromProfile(
                            visibleProfile?.tg_nickname ?? null,
                            visibleProfile?.vk_nickname ?? null,
                        )}
                        readOnly
                        onEdit={undefined}
                    />
                ) : editing ? (
                    <ProfileEditForm onCancel={() => setEditing(false)} />
                ) : (
                    <ProfileHeader
                        firstName={visibleProfile?.first_name ?? ""}
                        middleName={visibleProfile?.middle_name ?? ""}
                        lastName={visibleProfile?.last_name ?? ""}
                        role={visibleProfile?.role ?? ""}
                        phone={visibleProfile?.phone ?? ""}
                        email={visibleProfile?.email ?? ""}
                        socials={socialsFromProfile(
                            visibleProfile?.tg_nickname ?? null,
                            visibleProfile?.vk_nickname ?? null,
                        )}
                        readOnly={false}
                        onEdit={() => setEditing(true)}
                    />
                )}

                <ProfileActivity userId={otherUserId} />

                <Tabs
                    tabs={mainTabs}
                    value={activeTab}
                    onValueChange={handleTabChange}
                    variant="text"
                    className="mb-6"
                />

                {activeTab === "resume" && (
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-[7] min-w-0">
                            <ResumeList
                                resumes={resumes}
                                readOnly={isOtherUser}
                                onResumeClick={(id) => navigate(paths.app.resume.getHref(id))}
                                onCreateClick={
                                    isOtherUser
                                        ? undefined
                                        : () => navigate(paths.app.resume.create.getHref())
                                }
                                onShare={isOtherUser ? undefined : handleShare}
                                onDelete={isOtherUser ? undefined : handleDeleteClick}
                                onToggleVisibility={
                                    isOtherUser ? undefined : handleToggleVisibility
                                }
                                onSetDefault={isOtherUser ? undefined : handleSetDefault}
                            />
                        </div>
                        <div className="flex-[3] min-w-0">
                            <AdditionalSection
                                portfolio={visibleProfile?.portfolio ?? []}
                                education={visibleProfile?.education ?? []}
                                languages={visibleProfile?.languages ?? []}
                                readOnly={isOtherUser}
                            />
                        </div>
                    </div>
                )}

                {!isOtherUser && activeTab === "responses" && (
                    <div className="flex flex-col gap-10">
                        <ResponsesSection />
                        <InvitationsSection />
                    </div>
                )}

                {activeTab === "spaces" && (
                    <div className="flex flex-col gap-10">
                        <SpacesSection
                            spaces={isOtherUser ? otherProfile?.spaces : undefined}
                            readOnly={isOtherUser}
                        />
                        <ProjectsSection
                            projects={isOtherUser ? otherProfile?.projects : undefined}
                            readOnly={isOtherUser}
                        />
                    </div>
                )}
            </div>

            {!isOtherUser && (
                <ConfirmDeleteResumeDialog
                    open={!!deleteTarget}
                    onOpenChange={(open) => {
                        if (!open) setDeleteTarget(null);
                    }}
                    resumeTitle={deleteTarget?.position ?? ""}
                    onDelete={handleConfirmDelete}
                    isPending={deleteResumeMutation.isPending}
                />
            )}
        </ContentLayout>
    );
};

export default ProfileRoute;

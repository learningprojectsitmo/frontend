import { useState } from "react";
import { useNavigate } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { ProfileHeader, ResumeList, AdditionalSection } from "@/features/profile/components";
import { mapResumeFromApi } from "@/features/profile/components/resume-card";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useProfile } from "@/lib/profile";
import { paths } from "@/config/paths";
import { ResponsesSection } from "@/features/profile/components/responses-section";
import { InvitationsSection } from "@/features/profile/components/invitations-section";
import { SpacesSection } from "@/features/profile/components/spaces-section";
import { ProjectsSection } from "@/features/profile/components/projects-section";

const mainTabs = [
    { value: "resume", label: "Резюме" },
    { value: "responses", label: "Отклики и приглашения" },
    { value: "spaces", label: "Пространства и проекты" },
];

const spaceSubTabs = [
    { value: "spaces", label: "Пространства" },
    { value: "projects", label: "Проекты" },
];

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
    const [activeTab, setActiveTab] = useState("resume");
    const [activeSpaceTab, setActiveSpaceTab] = useState("spaces");
    const { data: profile } = useProfile();

    return (
        <ContentLayout title="Профиль и Резюме">
            <div className="mx-auto max-w-5xl p-4 sm:p-6 flex flex-col gap-5">
                <ProfileHeader
                    firstName={profile?.first_name ?? ""}
                    lastName={profile?.last_name ?? ""}
                    role={profile?.role ?? ""}
                    phone={profile?.phone ?? ""}
                    email={profile?.email ?? ""}
                    socials={socialsFromProfile(
                        profile?.tg_nickname ?? null,
                        profile?.vk_nickname ?? null,
                    )}
                />

                <Tabs
                    tabs={mainTabs}
                    value={activeTab}
                    onValueChange={setActiveTab}
                    variant="text"
                    className="mb-6"
                />

                {activeTab === "resume" && (
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-[7] min-w-0">
                            <ResumeList
                                resumes={(profile?.resumes ?? []).map(mapResumeFromApi)}
                                onResumeClick={(id) => navigate(paths.app.resume.getHref(id))}
                                onCreateClick={() => navigate(paths.app.resume.create.getHref())}
                            />
                        </div>
                        <div className="flex-[3] min-w-0">
                            <AdditionalSection
                                portfolio={profile?.portfolio ?? []}
                                education={profile?.education ?? []}
                                languages={profile?.languages ?? []}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "responses" && (
                    <div className="flex flex-col gap-10">
                        <ResponsesSection />
                        <InvitationsSection />
                    </div>
                )}

                {activeTab === "spaces" && (
                    <div>
                        <Tabs
                            tabs={spaceSubTabs}
                            value={activeSpaceTab}
                            onValueChange={setActiveSpaceTab}
                            variant="text"
                            className="mb-6"
                        />
                        {activeSpaceTab === "spaces" && <SpacesSection />}
                        {activeSpaceTab === "projects" && <ProjectsSection />}
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

export default ProfileRoute;

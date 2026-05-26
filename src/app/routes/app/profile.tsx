import { useState } from "react";
import { useNavigate } from "react-router";
import { ContentLayout } from "@/components/layouts";
import { Spinner } from "@/components/ui/spinner/spinner";
import { ProfileHeader, ResumeList, AdditionalSection } from "@/features/profile/components";
import { mapResumeFromApi } from "@/features/profile/components/resume-card";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useProfile } from "@/lib/profile";
import { paths } from "@/config/paths";

const tabs = [
    { value: "resume", label: "Резюме" },
    { value: "responses", label: "Отклики и приглашения" },
    { value: "spaces", label: "Пространства и проекты" },
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
    const { data: profile, isLoading } = useProfile();

    if (isLoading) {
        return (
            <ContentLayout title="Профиль и Резюме">
                <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
                    <Spinner size="lg" />
                </div>
            </ContentLayout>
        );
    }

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
                    tabs={tabs}
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

                {activeTab !== "resume" && (
                    <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400">
                        {activeTab === "responses"
                            ? "Отклики и приглашения"
                            : "Пространства и проекты"}
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

export default ProfileRoute;

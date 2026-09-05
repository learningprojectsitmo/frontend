import { ContentLayout } from "@/components/layouts";
import { Tabs } from "@/components/ui/tabs/tabs";
import { useState } from "react";
import { SessionsTab } from "@/features/settings/components/sessions-tab";

const SettingsPage = () => {
    const [activeTab, setActiveTab] = useState("general");

    const settingsTabs = [
        { value: "general", label: "Общие" },
        { value: "notifications", label: "Уведомления" },
        { value: "security", label: "Безопасность" },
    ];

    return (
        <ContentLayout title="Настройки">
            <div className="mx-auto max-w-7xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">Настройки</h1>
                    <p className="text-sm text-[--azure-46]">Управляйте настройками аккаунта</p>
                </div>

                <Tabs
                    tabs={settingsTabs}
                    value={activeTab}
                    onValueChange={setActiveTab}
                    variant="text"
                    className="mb-6"
                />

                {activeTab === "security" && <SessionsTab />}

                {activeTab === "general" && (
                    <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                        Раздел в разработке
                    </div>
                )}

                {activeTab === "notifications" && (
                    <div className="text-center py-16 text-sm text-[--azure-46] border border-[--color-black-10] rounded-2xl">
                        Раздел в разработке
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

export default SettingsPage;

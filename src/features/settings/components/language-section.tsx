import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useUser } from "@/lib/auth";
import { settingsApi } from "@/lib/settings";
import { queryKeys } from "@/lib/query-keys";
import { toast } from "sonner";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select/select";

const LANGUAGES = [
    { value: "ru", label: "Русский" },
    { value: "en", label: "English" },
] as const;

export const LanguageSection = () => {
    const { t, i18n } = useTranslation();
    const { data: user } = useUser();
    const queryClient = useQueryClient();

    const updateLanguage = useMutation({
        mutationFn: async (lang: string) => {
            i18n.changeLanguage(lang);
            if (user?.id) {
                await settingsApi.updateUserLanguage(user.id, lang);
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user() });
            toast.success(t("settings.saved"));
        },
        onError: () => {
            toast.error(t("settings.saveError"));
        },
    });

    const currentValue = user?.lang || i18n.language || "ru";

    return (
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
            <div className="p-6">
                <h2 className="text-[17px] font-semibold text-[--grey-4]">
                    {t("settings.language")}
                </h2>
                <p className="mt-1 text-sm text-[--azure-46]">
                    {t("settings.languageDescription")}
                </p>

                <Select
                    value={currentValue}
                    onValueChange={(value) => updateLanguage.mutate(value)}
                    disabled={updateLanguage.isPending}
                >
                    <SelectTrigger className="mt-4 w-64">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                        {LANGUAGES.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                                {lang.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
};

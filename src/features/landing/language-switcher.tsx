import { useMutation } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";
import { useUser } from "@/lib/auth";
import { settingsApi } from "@/lib/settings";

const LANGUAGES = ["ru", "en"] as const;

/**
 * Переключатель языка на лендинге. Для авторизованного пользователя язык
 * дополнительно сохраняется на сервере — тем же вызовом, что и в настройках
 * профиля, чтобы при следующем входе язык не откатывался.
 */
export const LanguageSwitcher = () => {
    const { t, i18n } = useTranslation();
    const { data: user } = useUser();

    const changeLanguage = useMutation({
        mutationFn: async (lang: string) => {
            await i18n.changeLanguage(lang);
            if (user?.id) {
                await settingsApi.updateUserLanguage(user.id, lang);
            }
        },
    });

    const current = i18n.language === "en" ? "en" : "ru";

    return (
        <div
            role="group"
            aria-label={t("landing.language.label")}
            className="inline-flex items-center rounded-lg border border-gray-200 p-0.5"
        >
            {LANGUAGES.map((lang) => (
                <button
                    key={lang}
                    type="button"
                    onClick={() => changeLanguage.mutate(lang)}
                    disabled={changeLanguage.isPending}
                    aria-pressed={current === lang}
                    className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                        "disabled:opacity-50",
                        current === lang
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-500 hover:text-gray-700",
                    )}
                >
                    {lang.toUpperCase()}
                </button>
            ))}
        </div>
    );
};

import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { cn } from "@/lib/utils";
import i18n from "@/i18n/config";
import { useUser } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { settingsApi } from "@/lib/settings";

const LANGUAGES = ["ru", "en"] as const;

/**
 * Текущий язык компонента должен браться из экземпляра i18next и по событию
 * `languageChanged`, а не из `useTranslation()`:
 *
 * - `useTranslation()` в react-i18next@17 возвращает не сам экземпляр, а его
 *   обёртку (`createI18nWrapper`) — копию, снятую через
 *   `getOwnPropertyDescriptors`. Методы у такой копии bound-функции и потому
 *   меняют язык у настоящего экземпляра, но поле `language` в обёртке —
 *   замороженный снимок на момент создания. Переключатель, читавший
 *   `i18n.language` из обёртки, никогда не переключал активную кнопку.
 * - Собственная подписка на `languageChanged` не зависит от того, перерисовал
 *   ли компонент текст: активное состояние кнопок обновляется всегда.
 */
const useCurrentLanguage = (): string => {
    const [language, setLanguage] = useState<string>(i18n.language);

    useEffect(() => {
        const onLanguageChanged = (lng: string) => setLanguage(lng);
        i18n.on("languageChanged", onLanguageChanged);
        return () => {
            i18n.off("languageChanged", onLanguageChanged);
        };
    }, []);

    return language;
};

/**
 * Переключатель языка на лендинге.
 *
 * Язык интерфейса меняется сразу и не зависит от сети: сохранение — отдельный
 * запрос. Раньше он был первым шагом `mutationFn`, поэтому любой сбой запроса
 * (или просто медленный ответ) оставлял страницу на старом языке без единого
 * признака ошибки — визуально переключатель просто не работал. Теперь
 * `onError` сообщает о неудаче, а интерфейс уже на нужном языке.
 *
 * Язык дополнительно сохраняется на сервере — тем же вызовом, что и в
 * настройках профиля, чтобы при следующем входе язык не откатывался.
 */
export const LanguageSwitcher = () => {
    const { t } = useTranslation();
    const { data: user } = useUser();
    const queryClient = useQueryClient();
    const language = useCurrentLanguage();

    const saveLanguage = useMutation({
        mutationFn: async (lang: string) => {
            if (user?.id) {
                await settingsApi.updateUserLanguage(user.id, lang);
            }
        },
        onSuccess: () => {
            // В кэше пользователя остался бы прежний `lang`, и `LanguageSync`
            // после refetch вернул бы язык, который юзер уже сменил.
            queryClient.invalidateQueries({ queryKey: queryKeys.user() });
        },
        onError: () => {
            toast.error(t("settings.saveError"));
        },
    });

    const changeLanguage = (lang: string) => {
        void i18n.changeLanguage(lang);
        saveLanguage.mutate(lang);
    };

    const current = language === "en" ? "en" : "ru";

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
                    onClick={() => changeLanguage(lang)}
                    aria-pressed={current === lang}
                    className={cn(
                        "rounded-md px-2 py-1 text-xs font-medium transition-colors",
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

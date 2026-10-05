import { useEffect } from "react";

import i18n from "@/i18n/config";

import { useUser } from "./auth";

export function LanguageSync() {
    const { data: user } = useUser();

    useEffect(() => {
        // Экземпляр импортируется напрямую, а не берётся из
        // `useTranslation()`: тот отдаёт обёртку с замороженным полем
        // `language`, из-за чего проверка «текущий язык == язык пользователя»
        // сравнивала снимок с самим собой и никогда не срабатывала.
        if (user?.lang && i18n.language !== user.lang) {
            void i18n.changeLanguage(user.lang);
        }
    }, [user?.lang]);

    return null;
}

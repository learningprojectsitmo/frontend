import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { useUser } from "./auth";

export function LanguageSync() {
    const { data: user } = useUser();
    const { i18n } = useTranslation();

    useEffect(() => {
        if (user?.lang && i18n.language !== user.lang) {
            i18n.changeLanguage(user.lang);
        }
    }, [user?.lang, i18n]);

    return null;
}

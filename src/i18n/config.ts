import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import dayjs from "dayjs";
import "dayjs/locale/ru";

import en from "./en";
import ru from "./ru";

i18n.use(initReactI18next).init({
    resources: {
        en,
        ru,
    },
    lng: "ru",
    fallbackLng: "ru",
    interpolation: {
        escapeValue: false,
    },
});

dayjs.locale("ru");

const SUPPORTED_LANGUAGES = ["ru", "en"] as const;

const isSupported = (lng: string): lng is (typeof SUPPORTED_LANGUAGES)[number] =>
    (SUPPORTED_LANGUAGES as readonly string[]).includes(lng);

const applyDocumentLanguage = (lng: string) => {
    if (typeof document === "undefined") return;
    // Скринридеры и поисковики ориентируются на `lang`, а он в index.html
    // проставлен статически — без синхронизации английская страница продолжает
    // объявляться русской.
    document.documentElement.lang = isSupported(lng) ? lng : "ru";
};

applyDocumentLanguage(i18n.language);

i18n.on("languageChanged", (lng: string) => {
    dayjs.locale(lng);
    applyDocumentLanguage(lng);
});

export default i18n;

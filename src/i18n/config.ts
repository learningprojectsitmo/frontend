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

i18n.on("languageChanged", (lng: string) => {
    dayjs.locale(lng);
});

export default i18n;

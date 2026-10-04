import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/icons";

import { AUDIENCE } from "../data/content";
import { Section, SectionHeading } from "../ui/section";

export const Audience = () => {
    const { t } = useTranslation();

    return (
        <Section id="audience" tone="plain" className="py-20">
            <SectionHeading
                title={t("landing.audience.title")}
                subtitle={t("landing.audience.subtitle")}
            />

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {AUDIENCE.map((item) => (
                    <div
                        key={item.titleKey}
                        className="rounded-2xl border border-gray-200 bg-app-surface p-6"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                            <Icon name={item.icon} size={18} />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-gray-900">
                            {t(item.titleKey)}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">
                            {t(item.descriptionKey)}
                        </p>
                    </div>
                ))}
            </div>
        </Section>
    );
};

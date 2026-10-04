import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/icons";

import { STEPS } from "../data/content";
import { Section, SectionHeading } from "../ui/section";

const STEP_ICONS = ["project", "members", "list"] as const;

export const HowItWorks = () => {
    const { t } = useTranslation();

    return (
        <Section id="how-it-works" tone="plain" className="py-20">
            <SectionHeading
                title={t("landing.howItWorks.title")}
                subtitle={t("landing.howItWorks.subtitle")}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {STEPS.map((step, index) => (
                    <div key={step.titleKey} className="relative rounded-2xl bg-gray-50 p-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-app-surface text-gray-700">
                            <Icon name={STEP_ICONS[index]} size={18} />
                        </div>
                        <h3 className="mt-4 text-base font-bold text-gray-900">
                            {t(step.titleKey)}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">
                            {t(step.descriptionKey)}
                        </p>
                    </div>
                ))}
            </div>
        </Section>
    );
};

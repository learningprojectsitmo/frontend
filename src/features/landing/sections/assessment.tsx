import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/icons";
import type { IconName } from "@/components/ui/icons/icons.types";

import { ASSESSMENT_STEPS } from "../data/content";
import { AssessmentMockup } from "../mockups/assessment-mockup";
import { Section, SectionHeading } from "../ui/section";

const STEP_ICONS: IconName[] = ["calendar", "clock", "exam", "check-mark"];

export const Assessment = () => {
    const { t } = useTranslation();

    return (
        <Section id="assessment" tone="surface" className="py-20">
            <SectionHeading
                badge={t("landing.assessment.badge")}
                title={t("landing.assessment.title")}
                subtitle={t("landing.assessment.subtitle")}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
                {ASSESSMENT_STEPS.map((step, index) => (
                    <div
                        key={step.titleKey}
                        className="relative rounded-2xl border border-gray-200 bg-app-surface p-6"
                    >
                        <span className="absolute right-5 top-5 text-xs font-semibold tabular-nums text-gray-300">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
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

            <div className="mt-12">
                <AssessmentMockup />
            </div>
        </Section>
    );
};

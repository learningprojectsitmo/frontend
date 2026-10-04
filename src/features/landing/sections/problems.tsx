import { useTranslation } from "react-i18next";

import { PROBLEMS } from "../data/content";
import { Section, SectionHeading } from "../ui/section";

export const Problems = () => {
    const { t } = useTranslation();

    return (
        <Section id="problems" tone="muted" className="py-20">
            <SectionHeading
                title={t("landing.problems.title")}
                subtitle={t("landing.problems.subtitle")}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {PROBLEMS.map((problem, index) => (
                    <div
                        key={problem.titleKey}
                        className="rounded-2xl border border-gray-200 bg-app-surface p-6"
                    >
                        <span className="text-xs font-semibold tabular-nums text-gray-300">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <h3 className="mt-3 text-base font-bold text-gray-900">
                            {t(problem.titleKey)}
                        </h3>
                        <p className="mt-2 text-sm leading-relaxed text-gray-500">
                            {t(problem.descriptionKey)}
                        </p>
                    </div>
                ))}
            </div>
        </Section>
    );
};

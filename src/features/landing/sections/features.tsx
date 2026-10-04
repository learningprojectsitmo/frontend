import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/icons";

import { FEATURE_GROUPS } from "../data/content";
import { KanbanMockup } from "../mockups/kanban-mockup";
import { Section, SectionHeading } from "../ui/section";

export const Features = () => {
    const { t } = useTranslation();

    return (
        <Section id="features" tone="muted" className="py-20">
            <SectionHeading
                title={t("landing.features.title")}
                subtitle={t("landing.features.subtitle")}
            />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {FEATURE_GROUPS.map((group) => (
                    <div
                        key={group.titleKey}
                        className="rounded-2xl border border-gray-200 bg-app-surface p-6"
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                                <Icon name={group.icon} size={18} />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">
                                {t(group.titleKey)}
                            </h3>
                        </div>

                        <ul className="mt-5 space-y-3">
                            {group.itemKeys.map((itemKey) => (
                                <li key={itemKey} className="flex gap-2.5 text-sm text-gray-600">
                                    <Icon
                                        name="check"
                                        size={16}
                                        className="mt-0.5 shrink-0 text-app-blue"
                                    />
                                    <span className="leading-relaxed">{t(itemKey)}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-12">
                <KanbanMockup />
            </div>
        </Section>
    );
};

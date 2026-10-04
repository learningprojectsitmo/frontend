import type { IconName } from "@/components/ui/icons/icons.types";

/**
 * Структура секций лендинга. Тексты намеренно не хранятся здесь — только
 * ключи i18n, чтобы копирайт правился в `src/i18n` и не таскал правки по JSX.
 */

export type FeatureGroup = {
    icon: IconName;
    titleKey: string;
    itemKeys: string[];
};

export const FEATURE_GROUPS: FeatureGroup[] = [
    {
        icon: "members",
        titleKey: "landing.features.groups.0.title",
        itemKeys: [
            "landing.features.groups.0.items.0",
            "landing.features.groups.0.items.1",
            "landing.features.groups.0.items.2",
            "landing.features.groups.0.items.3",
        ],
    },
    {
        icon: "list",
        titleKey: "landing.features.groups.1.title",
        itemKeys: [
            "landing.features.groups.1.items.0",
            "landing.features.groups.1.items.1",
            "landing.features.groups.1.items.2",
            "landing.features.groups.1.items.3",
        ],
    },
    {
        icon: "filter",
        titleKey: "landing.features.groups.2.title",
        itemKeys: [
            "landing.features.groups.2.items.0",
            "landing.features.groups.2.items.1",
            "landing.features.groups.2.items.2",
            "landing.features.groups.2.items.3",
        ],
    },
];

export type StepCard = {
    titleKey: string;
    descriptionKey: string;
};

export const STEPS: StepCard[] = [
    {
        titleKey: "landing.howItWorks.steps.0.title",
        descriptionKey: "landing.howItWorks.steps.0.description",
    },
    {
        titleKey: "landing.howItWorks.steps.1.title",
        descriptionKey: "landing.howItWorks.steps.1.description",
    },
    {
        titleKey: "landing.howItWorks.steps.2.title",
        descriptionKey: "landing.howItWorks.steps.2.description",
    },
];

export type ProblemCard = {
    titleKey: string;
    descriptionKey: string;
};

export const PROBLEMS: ProblemCard[] = [
    {
        titleKey: "landing.problems.items.0.title",
        descriptionKey: "landing.problems.items.0.description",
    },
    {
        titleKey: "landing.problems.items.1.title",
        descriptionKey: "landing.problems.items.1.description",
    },
    {
        titleKey: "landing.problems.items.2.title",
        descriptionKey: "landing.problems.items.2.description",
    },
];

export type AudienceCard = {
    icon: IconName;
    titleKey: string;
    descriptionKey: string;
};

export const AUDIENCE: AudienceCard[] = [
    {
        icon: "sidebar",
        titleKey: "landing.audience.items.0.title",
        descriptionKey: "landing.audience.items.0.description",
    },
    {
        icon: "university",
        titleKey: "landing.audience.items.1.title",
        descriptionKey: "landing.audience.items.1.description",
    },
    {
        icon: "magnifier",
        titleKey: "landing.audience.items.2.title",
        descriptionKey: "landing.audience.items.2.description",
    },
    {
        icon: "rocket",
        titleKey: "landing.audience.items.3.title",
        descriptionKey: "landing.audience.items.3.description",
    },
    {
        icon: "calendar",
        titleKey: "landing.audience.items.4.title",
        descriptionKey: "landing.audience.items.4.description",
    },
];

export type FaqItem = {
    questionKey: string;
    answerKey: string;
};

export const FAQ: FaqItem[] = [
    { questionKey: "landing.faq.items.0.question", answerKey: "landing.faq.items.0.answer" },
    { questionKey: "landing.faq.items.1.question", answerKey: "landing.faq.items.1.answer" },
    { questionKey: "landing.faq.items.2.question", answerKey: "landing.faq.items.2.answer" },
    { questionKey: "landing.faq.items.3.question", answerKey: "landing.faq.items.3.answer" },
    { questionKey: "landing.faq.items.4.question", answerKey: "landing.faq.items.4.answer" },
    { questionKey: "landing.faq.items.5.question", answerKey: "landing.faq.items.5.answer" },
    { questionKey: "landing.faq.items.6.question", answerKey: "landing.faq.items.6.answer" },
];

export type NavLink = {
    anchor: string;
    labelKey: string;
};

export const NAV_LINKS: NavLink[] = [
    { anchor: "features", labelKey: "landing.nav.features" },
    { anchor: "how-it-works", labelKey: "landing.nav.howItWorks" },
    { anchor: "audience", labelKey: "landing.nav.audience" },
    { anchor: "faq", labelKey: "landing.nav.faq" },
];

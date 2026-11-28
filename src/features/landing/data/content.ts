import type { IconName } from "@/components/ui/icons/icons.types";
import { paths } from "@/config/paths";

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
    {
        icon: "exam",
        titleKey: "landing.features.groups.3.title",
        itemKeys: [
            "landing.features.groups.3.items.0",
            "landing.features.groups.3.items.1",
            "landing.features.groups.3.items.2",
            "landing.features.groups.3.items.3",
        ],
    },
];

export type AssessmentStep = {
    titleKey: string;
    descriptionKey: string;
};

export const ASSESSMENT_STEPS: AssessmentStep[] = [
    {
        titleKey: "landing.assessment.steps.0.title",
        descriptionKey: "landing.assessment.steps.0.description",
    },
    {
        titleKey: "landing.assessment.steps.1.title",
        descriptionKey: "landing.assessment.steps.1.description",
    },
    {
        titleKey: "landing.assessment.steps.2.title",
        descriptionKey: "landing.assessment.steps.2.description",
    },
    {
        titleKey: "landing.assessment.steps.3.title",
        descriptionKey: "landing.assessment.steps.3.description",
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

export type FaqCategory = "general" | "projects" | "grading" | "data";

export type FaqItem = {
    questionKey: string;
    answerKey: string;
    category: FaqCategory;
};

export const FAQ_CATEGORIES: { id: FaqCategory; titleKey: string }[] = [
    { id: "general", titleKey: "landing.faq.categories.general" },
    { id: "projects", titleKey: "landing.faq.categories.projects" },
    { id: "grading", titleKey: "landing.faq.categories.grading" },
    { id: "data", titleKey: "landing.faq.categories.data" },
];

export const FAQ: FaqItem[] = [
    {
        questionKey: "landing.faq.items.0.question",
        answerKey: "landing.faq.items.0.answer",
        category: "general",
    },
    {
        questionKey: "landing.faq.items.1.question",
        answerKey: "landing.faq.items.1.answer",
        category: "general",
    },
    {
        questionKey: "landing.faq.items.2.question",
        answerKey: "landing.faq.items.2.answer",
        category: "general",
    },
    {
        questionKey: "landing.faq.items.3.question",
        answerKey: "landing.faq.items.3.answer",
        category: "projects",
    },
    {
        questionKey: "landing.faq.items.4.question",
        answerKey: "landing.faq.items.4.answer",
        category: "projects",
    },
    {
        questionKey: "landing.faq.items.5.question",
        answerKey: "landing.faq.items.5.answer",
        category: "projects",
    },
    {
        questionKey: "landing.faq.items.6.question",
        answerKey: "landing.faq.items.6.answer",
        category: "projects",
    },
    {
        questionKey: "landing.faq.items.7.question",
        answerKey: "landing.faq.items.7.answer",
        category: "grading",
    },
    {
        questionKey: "landing.faq.items.8.question",
        answerKey: "landing.faq.items.8.answer",
        category: "grading",
    },
    {
        questionKey: "landing.faq.items.9.question",
        answerKey: "landing.faq.items.9.answer",
        category: "grading",
    },
    {
        questionKey: "landing.faq.items.10.question",
        answerKey: "landing.faq.items.10.answer",
        category: "grading",
    },
    {
        questionKey: "landing.faq.items.11.question",
        answerKey: "landing.faq.items.11.answer",
        category: "data",
    },
    {
        questionKey: "landing.faq.items.12.question",
        answerKey: "landing.faq.items.12.answer",
        category: "data",
    },
    {
        questionKey: "landing.faq.items.13.question",
        answerKey: "landing.faq.items.13.answer",
        category: "data",
    },
];

export type NavLink = {
    href: string;
    labelKey: string;
};

export const NAV_LINKS: NavLink[] = [
    { href: paths.landing.features.getHref(), labelKey: "landing.nav.features" },
    { href: paths.landing.assessment.getHref(), labelKey: "landing.nav.assessment" },
    { href: paths.landing.howItWorks.getHref(), labelKey: "landing.nav.howItWorks" },
    { href: paths.landing.audience.getHref(), labelKey: "landing.nav.audience" },
    { href: paths.landing.faq.getHref(), labelKey: "landing.nav.faq" },
];

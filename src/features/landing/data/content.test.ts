import { describe, expect, it } from "vitest";

import en from "@/i18n/en";
import ru from "@/i18n/ru";

import { AUDIENCE, FAQ, FEATURE_GROUPS, NAV_LINKS, PROBLEMS, STEPS } from "./content";

type Dict = Record<string, unknown>;

const lookup = (source: Dict, path: string): unknown =>
    path.split(".").reduce<unknown>((node, key) => {
        if (node === null || typeof node !== "object") return undefined;
        return (node as Dict)[key];
    }, source);

/** Все ключи, которые рендерятся через `t()` — и структурные, и из content.ts. */
const STATIC_KEYS = [
    "landing.meta.title",
    "landing.meta.description",
    "landing.nav.login",
    "landing.nav.register",
    "landing.nav.openApp",
    "landing.nav.menu",
    "landing.language.label",
    "landing.hero.badge",
    "landing.hero.titleTop",
    "landing.hero.titleBottom",
    "landing.hero.subtitle",
    "landing.hero.primaryCta",
    "landing.hero.secondaryCta",
    "landing.hero.note",
    "landing.hero.mockupLabel",
    "landing.mockup.search",
    "landing.mockup.progressLabel",
    "landing.mockup.boardFilter",
    "landing.mockup.wip",
    "landing.nav.toggleTheme",
    "landing.problems.title",
    "landing.problems.subtitle",
    "landing.howItWorks.title",
    "landing.howItWorks.subtitle",
    "landing.features.title",
    "landing.features.subtitle",
    "landing.features.kanbanLabel",
    "landing.audience.title",
    "landing.audience.subtitle",
    "landing.faq.title",
    "landing.finalCta.title",
    "landing.finalCta.description",
    "landing.finalCta.button",
    "landing.footer.tagline",
    "landing.footer.product",
    "landing.footer.legal",
    "landing.footer.privacy",
    "landing.footer.cookies",
    "landing.footer.rights",
];

const DYNAMIC_KEYS = [
    ...NAV_LINKS.map((link) => link.labelKey),
    ...STEPS.flatMap((step) => [step.titleKey, step.descriptionKey]),
    ...PROBLEMS.flatMap((problem) => [problem.titleKey, problem.descriptionKey]),
    ...FEATURE_GROUPS.flatMap((group) => [group.titleKey, ...group.itemKeys]),
    ...AUDIENCE.flatMap((item) => [item.titleKey, item.descriptionKey]),
    ...FAQ.flatMap((item) => [item.questionKey, item.answerKey]),
];

/**
 * Ключ i18n, которого нет, i18next отрисовывает как есть — пользователь видит
 * в тексте «landing.hero.titleTop». Лендинг наполовину на русском, наполовину
 * на английском, поэтому проверяем обе локали и их паритет: забытый перевод
 * проявится либо пустой строкой, либо английским текстом у русского Visitor.
 */
describe("landing i18n", () => {
    const locales = [
        ["ru", (ru as Dict).translation as Dict],
        ["en", (en as Dict).translation as Dict],
    ] as const;

    it.each(locales)("%s: все ключи лендинга существуют", (_name, dict) => {
        const missing = [...STATIC_KEYS, ...DYNAMIC_KEYS].filter(
            (key) => typeof lookup(dict, key) !== "string",
        );

        expect(missing).toEqual([]);
    });

    it.each(locales)("%s: строки лендинга не пустые", (_name, dict) => {
        const empty = [...STATIC_KEYS, ...DYNAMIC_KEYS].filter((key) => {
            const value = lookup(dict, key);
            return typeof value === "string" && value.trim() === "";
        });

        expect(empty).toEqual([]);
    });

    it("ru и en содержат одинаковый набор ключей landing", () => {
        const collect = (value: unknown, prefix = ""): string[] => {
            if (value === null || typeof value !== "object") return [prefix];
            return Object.entries(value as Dict).flatMap(([key, child]) =>
                collect(child, prefix ? `${prefix}.${key}` : key),
            );
        };

        // Формы множественного числа устроены по-разному: у русского их четыре
        // (one/few/many/other), у английского две (one/other) — это требование
        // Intl.PluralRules, а не отсутствующий перевод. Сравниваем базовые ключи.
        const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
        const base = (keys: string[]) => keys.map((key) => key.replace(PLURAL_SUFFIX, ""));

        const ruKeys = base(collect((ru as Dict).translation)).sort();
        const enKeys = base(collect((en as Dict).translation)).sort();

        expect(enKeys.filter((key) => !ruKeys.includes(key))).toEqual([]);
        expect(ruKeys.filter((key) => !enKeys.includes(key))).toEqual([]);
    });

    it.each(locales)("%s: у каждого ключа с множественными формами есть _other", (_n, dict) => {
        const collect = (value: unknown, prefix = ""): string[] => {
            if (value === null || typeof value !== "object") return [prefix];
            return Object.entries(value as Dict).flatMap(([key, child]) =>
                collect(child, prefix ? `${prefix}.${key}` : key),
            );
        };

        const keys = collect(dict);
        const bases = new Set(
            keys
                .filter((key) => /_(zero|one|two|few|many|other)$/.test(key))
                .map((key) => key.replace(/_(zero|one|two|few|many|other)$/, "")),
        );

        const withoutOther = [...bases].filter((base) => !keys.includes(`${base}_other`));

        expect(withoutOther).toEqual([]);
    });
});

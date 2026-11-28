import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import { cn } from "@/lib/utils";

import { FAQ, FAQ_CATEGORIES, type FaqCategory } from "../data/content";
import { Section, SectionHeading } from "../ui/section";
import { useLandingAuth } from "../use-landing-auth";

/**
 * FAQ с поиском и категориями. Ответы живут в нативных `<details>`: работают
 * без JS, доступны с клавиатуры и разбираются поисковиками. Фильтры лишь
 * скрывают лишние вопросы, поэтому базовая доступность не зависит от состояния.
 */
export const Faq = ({ as }: { as?: "h1" | "h2" }) => {
    const { t } = useTranslation();
    const isLoggedIn = useLandingAuth();
    const [query, setQuery] = useState("");
    const [category, setCategory] = useState<"all" | FaqCategory>("all");

    const normalizedQuery = query.trim().toLowerCase();
    const visible = useMemo(
        () =>
            FAQ.filter((item) => {
                const matchesCategory = category === "all" || item.category === category;
                const matchesQuery =
                    !normalizedQuery ||
                    t(item.questionKey).toLowerCase().includes(normalizedQuery) ||
                    t(item.answerKey).toLowerCase().includes(normalizedQuery);
                return matchesCategory && matchesQuery;
            }),
        [category, normalizedQuery, t],
    );

    const primaryHref = isLoggedIn ? paths.app.spaces.getHref() : paths.auth.createAcc.getHref();

    return (
        <Section id="faq" tone="muted" className="py-20">
            <SectionHeading
                as={as}
                title={t("landing.faq.title")}
                subtitle={t("landing.faq.subtitle")}
            />

            <div className="mx-auto max-w-3xl">
                <div className="relative">
                    <Icon
                        name="magnifier"
                        size={16}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        aria-label={t("landing.faq.searchLabel")}
                        placeholder={t("landing.faq.searchPlaceholder")}
                        className="h-12 w-full rounded-xl border border-gray-200 bg-app-surface pl-11 pr-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-app-blue focus:ring-2 focus:ring-app-blue/20"
                    />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setCategory("all")}
                        aria-pressed={category === "all"}
                        className={cn(
                            "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                            category === "all"
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900",
                        )}
                    >
                        {t("landing.faq.all")}
                    </button>
                    {FAQ_CATEGORIES.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setCategory(item.id)}
                            aria-pressed={category === item.id}
                            className={cn(
                                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                                category === item.id
                                    ? "border-gray-900 bg-gray-900 text-white"
                                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900",
                            )}
                        >
                            {t(item.titleKey)}
                        </button>
                    ))}
                </div>

                <div className="mt-6 flex flex-col gap-3">
                    {visible.map((item) => (
                        <details
                            key={item.questionKey}
                            className="group rounded-2xl border border-gray-200 bg-app-surface px-5 py-4 open:border-gray-300 [&[open]_summary_svg]:rotate-45"
                        >
                            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-gray-900 marker:hidden">
                                {t(item.questionKey)}
                                <Icon
                                    name="plus"
                                    size={16}
                                    className="shrink-0 text-gray-400 transition-transform motion-reduce:transition-none"
                                />
                            </summary>
                            <p className="mt-3 text-sm leading-relaxed text-gray-500">
                                {t(item.answerKey)}
                            </p>
                        </details>
                    ))}
                </div>

                {visible.length === 0 && (
                    <div className="mt-6 rounded-2xl border border-dashed border-gray-200 px-6 py-10 text-center">
                        <Icon name="magnifier" size={20} className="mx-auto text-gray-300" />
                        <p className="mt-3 text-sm font-semibold text-gray-900">
                            {t("landing.faq.emptyTitle")}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">
                            {t("landing.faq.emptyDescription")}
                        </p>
                    </div>
                )}

                <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 px-6 py-8 text-center">
                    <p className="text-base font-bold text-gray-900">{t("landing.faq.ctaTitle")}</p>
                    <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                        {t("landing.faq.ctaDescription")}
                    </p>
                    <Button asChild size="hug48" variant="dark" className="mt-5 font-semibold">
                        <Link to={primaryHref}>
                            {isLoggedIn ? t("landing.nav.openApp") : t("landing.faq.ctaButton")}
                        </Link>
                    </Button>
                </div>
            </div>
        </Section>
    );
};

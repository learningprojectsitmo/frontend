import { useTranslation } from "react-i18next";

import { Icon } from "@/components/ui/icons";

import { FAQ } from "../data/content";
import { Section, SectionHeading } from "../ui/section";

/**
 * FAQ на нативном `<details>`: работает без JS, доступен с клавиатуры и
 * разбирается поисковиками. Зависимость @radix-ui/react-accordion ради шести
 * вопросов не тянем.
 */
export const Faq = () => {
    const { t } = useTranslation();

    return (
        <Section id="faq" tone="muted" className="py-20">
            <SectionHeading title={t("landing.faq.title")} />

            <div className="mx-auto flex max-w-3xl flex-col gap-3">
                {FAQ.map((item) => (
                    <details
                        key={item.questionKey}
                        className="group rounded-2xl border border-gray-200 bg-app-surface px-5 py-4 [&[open]_svg]:rotate-180"
                    >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-gray-900 marker:hidden">
                            {t(item.questionKey)}
                            <Icon
                                name="arrow-down"
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
        </Section>
    );
};

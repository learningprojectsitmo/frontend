import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionProps = {
    id?: string;
    /** `surface` — чередует фон секций, `plain` — без фона (hero, финальный CTA). */
    tone?: "surface" | "plain" | "muted";
    className?: string;
    children: ReactNode;
};

const TONE_CLASS: Record<NonNullable<SectionProps["tone"]>, string> = {
    plain: "",
    surface: "bg-gray-50",
    muted: "bg-app-surface border-t border-gray-200",
};

export const Section = ({ id, tone = "plain", className, children }: SectionProps) => (
    <section id={id} className={cn(TONE_CLASS[tone], className)}>
        <div className="mx-auto max-w-7xl px-6">{children}</div>
    </section>
);

type SectionHeadingProps = {
    title: string;
    subtitle?: string;
    /** Небольшой бейдж над заголовком, например «Новое». */
    badge?: string;
    /** На отдельной странице заголовок секции становится главным заголовком. */
    as?: "h1" | "h2";
    /** `center` для секций-«высказываний», `left` для длинных списков. */
    align?: "center" | "left";
    className?: string;
};

export const SectionHeading = ({
    title,
    subtitle,
    badge,
    as: Heading = "h2",
    align = "center",
    className,
}: SectionHeadingProps) => (
    <div
        className={cn(
            "mb-12 flex flex-col",
            align === "center" ? "items-center text-center" : "items-start text-left",
            className,
        )}
    >
        {badge ? (
            <span className="mb-3 inline-flex items-center rounded-full border border-gray-200 bg-app-surface px-3 py-1 text-xs font-medium text-gray-600">
                {badge}
            </span>
        ) : null}
        <Heading className="text-3xl font-bold tracking-tight text-gray-900 motion-reduce:animate-none">
            {title}
        </Heading>
        {subtitle ? <p className="mt-3 max-w-2xl text-base text-gray-500">{subtitle}</p> : null}
    </div>
);

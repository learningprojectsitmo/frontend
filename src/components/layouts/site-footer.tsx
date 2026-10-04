import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import { useCookieConsent } from "@/features/privacy/cookie-consent-provider";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
    /**
     * `landing` — ссылки-якоря на секции самой страницы.
     * `app`     — те же ссылки, но уже с лендинга (в приложении якорей нет).
     * Текст и вёрстка в обоих вариантах идентичны.
     */
    variant?: "landing" | "app";
    className?: string;
}

const SECTION_LINKS = [
    { hash: "features", labelKey: "landing.nav.features" },
    { hash: "how-it-works", labelKey: "landing.nav.howItWorks" },
    { hash: "faq", labelKey: "landing.nav.faq" },
] as const;

const linkClass = "break-words text-sm text-gray-500 transition-colors hover:text-gray-900";

export const SiteFooter = ({ variant = "landing", className }: SiteFooterProps) => {
    const { t } = useTranslation();
    const { openSettings } = useCookieConsent();

    const sectionHref = (hash: string) =>
        variant === "landing" ? `#${hash}` : `${paths.home.getHref()}#${hash}`;

    return (
        <footer className={cn("border-t border-gray-200 bg-gray-50", className)}>
            <div className="mx-auto max-w-7xl px-6 py-12">
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
                    <div className="flex flex-col gap-3 sm:col-span-2 md:col-span-1">
                        <Icon
                            name="logo-edu-flow"
                            width={100}
                            height={28}
                            alt="EduFlow"
                            color="var(--app-text)"
                        />
                        <p className="max-w-xs text-sm text-gray-500">
                            {t("landing.footer.tagline")}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                            {t("landing.footer.product")}
                        </span>
                        {SECTION_LINKS.map(({ hash, labelKey }) =>
                            variant === "landing" ? (
                                <a key={hash} href={`#${hash}`} className={linkClass}>
                                    {t(labelKey)}
                                </a>
                            ) : (
                                <Link key={hash} to={sectionHref(hash)} className={linkClass}>
                                    {t(labelKey)}
                                </Link>
                            ),
                        )}
                    </div>

                    <div className="flex flex-col gap-3">
                        <span className="text-sm font-semibold text-gray-900">
                            {t("landing.footer.legal")}
                        </span>
                        <Link to={paths.legal.privacy.getHref()} className={linkClass}>
                            {t("landing.footer.privacy")}
                        </Link>
                        <button
                            type="button"
                            onClick={openSettings}
                            className={cn(linkClass, "text-left")}
                        >
                            {t("landing.footer.cookies")}
                        </button>
                    </div>
                </div>

                <p className="mt-10 text-xs text-gray-400">
                    &copy; {new Date().getFullYear()} EduFlow. {t("landing.footer.rights")}
                </p>
            </div>
        </footer>
    );
};

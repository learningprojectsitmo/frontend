import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import { useCookieConsent } from "@/features/privacy/cookie-consent-provider";
import { cn } from "@/lib/utils";

interface SiteFooterProps {
    className?: string;
}

const SECTION_LINKS = [
    { href: paths.landing.features.getHref(), labelKey: "landing.nav.features" },
    { href: paths.landing.assessment.getHref(), labelKey: "landing.nav.assessment" },
    { href: paths.landing.howItWorks.getHref(), labelKey: "landing.nav.howItWorks" },
    { href: paths.landing.audience.getHref(), labelKey: "landing.nav.audience" },
    { href: paths.landing.faq.getHref(), labelKey: "landing.nav.faq" },
] as const;

const linkClass = "break-words text-sm text-gray-500 transition-colors hover:text-gray-900";

export const SiteFooter = ({ className }: SiteFooterProps) => {
    const { t } = useTranslation();
    const { openSettings } = useCookieConsent();

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
                        {SECTION_LINKS.map(({ href, labelKey }) => (
                            <Link key={href} to={href} className={linkClass}>
                                {t(labelKey)}
                            </Link>
                        ))}
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

import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { paths } from "@/config/paths";

type LandingBreadcrumbProps = {
    current: string;
};

/** Навигационная цепочка над содержимым отдельной страницы лендинга. */
export const LandingBreadcrumb = ({ current }: LandingBreadcrumbProps) => {
    const { t } = useTranslation();

    return (
        <div className="border-b border-gray-200 bg-gray-50">
            <nav
                aria-label={t("landing.breadcrumb.label")}
                className="mx-auto max-w-7xl px-6 py-3 text-sm"
            >
                <Link
                    to={paths.home.getHref()}
                    className="text-gray-500 transition-colors hover:text-gray-900"
                >
                    {t("landing.breadcrumb.home")}
                </Link>
                <span aria-hidden="true" className="mx-2 text-gray-300">
                    /
                </span>
                <span className="font-medium text-gray-900">{current}</span>
            </nav>
        </div>
    );
};

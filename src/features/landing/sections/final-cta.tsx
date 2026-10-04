import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";

import { Section } from "../ui/section";

type FinalCtaProps = {
    isLoggedIn: boolean;
};

export const FinalCta = ({ isLoggedIn }: FinalCtaProps) => {
    const { t } = useTranslation();

    const primaryHref = isLoggedIn ? paths.app.spaces.getHref() : paths.auth.createAcc.getHref();

    return (
        <Section tone="plain" className="border-t border-gray-200 py-20">
            <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900">
                    {t("landing.finalCta.title")}
                </h2>
                <p className="mt-3 text-base text-gray-500">{t("landing.finalCta.description")}</p>

                <Button asChild size="hug48" variant="dark" className="mt-8 font-semibold">
                    <Link to={primaryHref}>
                        {isLoggedIn ? t("landing.nav.openApp") : t("landing.finalCta.button")}
                    </Link>
                </Button>

                <p className="mt-4 text-xs text-gray-400">{t("landing.hero.badge")}</p>
            </div>
        </Section>
    );
};

import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";

import { ProjectListMockup } from "../mockups/project-list-mockup";

type HeroProps = {
    isLoggedIn: boolean;
};

export const Hero = ({ isLoggedIn }: HeroProps) => {
    const { t } = useTranslation();

    const primaryHref = isLoggedIn ? paths.app.spaces.getHref() : paths.auth.createAcc.getHref();

    return (
        <div className="bg-gray-50">
            <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 sm:pt-24">
                <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
                    <span className="rounded-full border border-gray-200 bg-app-surface px-3 py-1 text-xs font-medium text-gray-600">
                        {t("landing.hero.badge")}
                    </span>

                    <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900 motion-safe:animate-fade-in-up sm:text-5xl">
                        {t("landing.hero.titleTop")}
                        <br />
                        {t("landing.hero.titleBottom")}
                    </h1>

                    <p
                        className="mt-5 max-w-2xl text-base leading-relaxed text-gray-500 motion-safe:animate-fade-in-up sm:text-lg"
                        style={{ animationDelay: "0.15s", opacity: 0 }}
                    >
                        {t("landing.hero.subtitle")}
                    </p>

                    <div
                        className="mt-8 flex flex-col items-center justify-center gap-3 motion-safe:animate-fade-in-up sm:flex-row"
                        style={{ animationDelay: "0.3s", opacity: 0 }}
                    >
                        <Button asChild size="hug48" variant="dark" className="font-semibold">
                            <Link to={primaryHref}>
                                {isLoggedIn
                                    ? t("landing.nav.openApp")
                                    : t("landing.hero.primaryCta")}
                            </Link>
                        </Button>
                        {!isLoggedIn ? (
                            <Button
                                asChild
                                size="hug48"
                                variant="outline"
                                className="font-semibold"
                            >
                                <Link to={paths.auth.login.getHref()}>
                                    {t("landing.hero.secondaryCta")}
                                </Link>
                            </Button>
                        ) : null}
                    </div>

                    <p className="mt-4 text-xs text-gray-400">{t("landing.hero.note")}</p>
                </div>

                <div
                    className="mx-auto mt-14 max-w-4xl motion-safe:animate-fade-in-up"
                    style={{ animationDelay: "0.45s", opacity: 0 }}
                >
                    <ProjectListMockup />
                </div>
            </div>
        </div>
    );
};

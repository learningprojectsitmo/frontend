import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { Menu, Moon, Sun, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/button/icon-button";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import { useTheme } from "@/lib/theme-provider";

import { NAV_LINKS } from "../data/content";
import { LanguageSwitcher } from "../language-switcher";

type HeaderProps = {
    isLoggedIn: boolean;
};

export const Header = ({ isLoggedIn }: HeaderProps) => {
    const { t } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const [menuOpen, setMenuOpen] = useState(false);

    const primaryHref = isLoggedIn ? paths.app.spaces.getHref() : paths.auth.createAcc.getHref();

    return (
        <header className="sticky top-0 z-40 border-b border-gray-200 bg-app-surface/90 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <Icon
                        name="logo-edu-flow"
                        width={100}
                        height={28}
                        alt="EduFlow"
                        color="var(--app-text)"
                    />
                </div>

                <nav className="hidden items-center gap-7 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.anchor}
                            href={`#${link.anchor}`}
                            className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                        >
                            {t(link.labelKey)}
                        </a>
                    ))}
                </nav>

                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <IconButton
                        className="outline-none flex h-9 w-9 cursor-pointer items-center justify-center"
                        icon={theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                        variant="ghost"
                        aria-label={t("landing.nav.toggleTheme")}
                        onClick={() => toggleTheme()}
                    />

                    <div className="hidden items-center gap-2 sm:flex">
                        {isLoggedIn ? (
                            <Button
                                asChild
                                variant="dark"
                                size="hug36"
                                className="rounded-xl text-[13px] font-semibold"
                            >
                                <Link to={primaryHref}>{t("landing.nav.openApp")}</Link>
                            </Button>
                        ) : (
                            <>
                                <Button
                                    asChild
                                    variant="ghost"
                                    size="hug36"
                                    className="rounded-xl text-[13px] font-semibold"
                                >
                                    <Link to={paths.auth.login.getHref()}>
                                        {t("landing.nav.login")}
                                    </Link>
                                </Button>
                                <Button
                                    asChild
                                    variant="dark"
                                    size="hug36"
                                    className="rounded-xl text-[13px] font-semibold"
                                >
                                    <Link to={primaryHref}>{t("landing.nav.register")}</Link>
                                </Button>
                            </>
                        )}
                    </div>

                    <IconButton
                        className="outline-none flex h-9 w-9 cursor-pointer items-center justify-center lg:hidden"
                        icon={menuOpen ? <X size={18} /> : <Menu size={18} />}
                        variant="ghost"
                        aria-label={t("landing.nav.menu")}
                        aria-expanded={menuOpen}
                        onClick={() => setMenuOpen((open) => !open)}
                    />
                </div>
            </div>

            {menuOpen ? (
                <div className="border-t border-gray-200 bg-app-surface px-6 py-4 lg:hidden">
                    <nav className="flex flex-col gap-3">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.anchor}
                                href={`#${link.anchor}`}
                                onClick={() => setMenuOpen(false)}
                                className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                            >
                                {t(link.labelKey)}
                            </a>
                        ))}
                    </nav>
                    <div className="mt-4 flex items-center gap-2">
                        {isLoggedIn ? (
                            <Button asChild variant="dark" size="hug36" className="w-full">
                                <Link to={primaryHref}>{t("landing.nav.openApp")}</Link>
                            </Button>
                        ) : (
                            <>
                                <Button asChild variant="outline" size="hug36" className="flex-1">
                                    <Link to={paths.auth.login.getHref()}>
                                        {t("landing.nav.login")}
                                    </Link>
                                </Button>
                                <Button asChild variant="dark" size="hug36" className="flex-1">
                                    <Link to={primaryHref}>{t("landing.nav.register")}</Link>
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            ) : null}
        </header>
    );
};

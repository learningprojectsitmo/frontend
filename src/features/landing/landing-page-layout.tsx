import type { ReactNode } from "react";

import { Head } from "@/components/seo";

import { FinalCta } from "./sections/final-cta";
import { Footer } from "./sections/footer";
import { Header } from "./sections/header";
import { LandingBreadcrumb } from "./ui/breadcrumb";
import { useLandingAuth } from "./use-landing-auth";

type LandingPageLayoutProps = {
    children: ReactNode;
    metaTitle: string;
    metaDescription: string;
    metaPath: string;
    jsonLd?: Record<string, unknown>;
    /** Текущая страница для хлебных крошек; у главной их нет. */
    breadcrumb?: string;
    /** Показывать финальный призыв к регистрации после содержимого. */
    showCta?: boolean;
};

/**
 * Общая оболочка публичных страниц: шапка, подвал и метаданные. Содержимое
 * страницы передаётся в `<main>`; главная дополнительно включает финальный CTA.
 */
export const LandingPageLayout = ({
    children,
    metaTitle,
    metaDescription,
    metaPath,
    jsonLd,
    breadcrumb,
    showCta = false,
}: LandingPageLayoutProps) => {
    const isLoggedIn = useLandingAuth();

    return (
        <>
            <Head title={metaTitle} description={metaDescription} path={metaPath} jsonLd={jsonLd} />

            <div id="main" className="min-h-screen bg-app-surface">
                <Header isLoggedIn={isLoggedIn} />
                {breadcrumb ? <LandingBreadcrumb current={breadcrumb} /> : null}
                <main>{children}</main>
                {showCta ? <FinalCta isLoggedIn={isLoggedIn} /> : null}
                <Footer />
            </div>
        </>
    );
};

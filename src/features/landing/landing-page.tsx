import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Head } from "@/components/seo";
import { paths } from "@/config/paths";
import { useUser } from "@/lib/auth";

import { FAQ } from "./data/content";
import { Audience } from "./sections/audience";
import { Faq } from "./sections/faq";
import { Features } from "./sections/features";
import { FinalCta } from "./sections/final-cta";
import { Footer } from "./sections/footer";
import { Header } from "./sections/header";
import { Hero } from "./sections/hero";
import { HowItWorks } from "./sections/how-it-works";
import { Problems } from "./sections/problems";

export const LandingPage = () => {
    const { t } = useTranslation();
    const { data: user, isLoading } = useUser();
    const isLoggedIn = !isLoading && Boolean(user);

    const jsonLd = useMemo(
        () => ({
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "SoftwareApplication",
                    name: "EduFlow",
                    applicationCategory: "BusinessApplication",
                    operatingSystem: "Web",
                    description: t("landing.meta.description"),
                    offers: {
                        "@type": "Offer",
                        price: "0",
                        priceCurrency: "RUB",
                    },
                },
                {
                    "@type": "FAQPage",
                    mainEntity: FAQ.map((item) => ({
                        "@type": "Question",
                        name: t(item.questionKey),
                        acceptedAnswer: {
                            "@type": "Answer",
                            text: t(item.answerKey),
                        },
                    })),
                },
            ],
        }),
        [t],
    );

    return (
        <>
            <Head
                title={t("landing.meta.title")}
                description={t("landing.meta.description")}
                path={paths.home.path}
                jsonLd={jsonLd}
            />

            <div id="main" className="min-h-screen bg-app-surface">
                <Header isLoggedIn={isLoggedIn} />
                <main>
                    <Hero isLoggedIn={isLoggedIn} />
                    <Problems />
                    <HowItWorks />
                    <Features />
                    <Audience />
                    <Faq />
                    <FinalCta isLoggedIn={isLoggedIn} />
                </main>
                <Footer />
            </div>
        </>
    );
};

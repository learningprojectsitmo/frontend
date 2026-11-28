import { useTranslation } from "react-i18next";

import { paths } from "@/config/paths";
import { LandingPageLayout } from "@/features/landing/landing-page-layout";
import { Faq } from "@/features/landing/sections/faq";

const FaqRoute = () => {
    const { t } = useTranslation();

    return (
        <LandingPageLayout
            metaTitle={t("landing.pages.faq.title")}
            metaDescription={t("landing.pages.faq.description")}
            metaPath={paths.landing.faq.path}
            breadcrumb={t("landing.nav.faq")}
            showCta
        >
            <Faq as="h1" />
        </LandingPageLayout>
    );
};

export default FaqRoute;

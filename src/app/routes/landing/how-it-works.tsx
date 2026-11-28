import { useTranslation } from "react-i18next";

import { paths } from "@/config/paths";
import { LandingPageLayout } from "@/features/landing/landing-page-layout";
import { HowItWorks } from "@/features/landing/sections/how-it-works";

const HowItWorksRoute = () => {
    const { t } = useTranslation();

    return (
        <LandingPageLayout
            metaTitle={t("landing.pages.howItWorks.title")}
            metaDescription={t("landing.pages.howItWorks.description")}
            metaPath={paths.landing.howItWorks.path}
            breadcrumb={t("landing.nav.howItWorks")}
            showCta
        >
            <HowItWorks as="h1" />
        </LandingPageLayout>
    );
};

export default HowItWorksRoute;

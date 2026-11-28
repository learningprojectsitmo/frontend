import { useTranslation } from "react-i18next";

import { paths } from "@/config/paths";
import { LandingPageLayout } from "@/features/landing/landing-page-layout";
import { Features } from "@/features/landing/sections/features";

const FeaturesRoute = () => {
    const { t } = useTranslation();

    return (
        <LandingPageLayout
            metaTitle={t("landing.pages.features.title")}
            metaDescription={t("landing.pages.features.description")}
            metaPath={paths.landing.features.path}
            breadcrumb={t("landing.nav.features")}
            showCta
        >
            <Features as="h1" />
        </LandingPageLayout>
    );
};

export default FeaturesRoute;

import { useTranslation } from "react-i18next";

import { paths } from "@/config/paths";
import { LandingPageLayout } from "@/features/landing/landing-page-layout";
import { Audience } from "@/features/landing/sections/audience";

const AudienceRoute = () => {
    const { t } = useTranslation();

    return (
        <LandingPageLayout
            metaTitle={t("landing.pages.audience.title")}
            metaDescription={t("landing.pages.audience.description")}
            metaPath={paths.landing.audience.path}
            breadcrumb={t("landing.nav.audience")}
            showCta
        >
            <Audience as="h1" />
        </LandingPageLayout>
    );
};

export default AudienceRoute;

import { useTranslation } from "react-i18next";

import { paths } from "@/config/paths";
import { LandingPageLayout } from "@/features/landing/landing-page-layout";
import { Assessment } from "@/features/landing/sections/assessment";

const AssessmentRoute = () => {
    const { t } = useTranslation();

    return (
        <LandingPageLayout
            metaTitle={t("landing.pages.assessment.title")}
            metaDescription={t("landing.pages.assessment.description")}
            metaPath={paths.landing.assessment.path}
            breadcrumb={t("landing.nav.assessment")}
            showCta
        >
            <Assessment as="h1" />
        </LandingPageLayout>
    );
};

export default AssessmentRoute;

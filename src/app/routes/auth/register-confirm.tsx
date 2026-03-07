import { useNavigate, useSearchParams } from "react-router";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { paths } from "@/config/paths";
import { RegisterConfirmForm } from "@/features/auth/components/register-confirm-form";

const RegisterConfirmRoute = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    return (
        <AuthLayout title="Введите код из письма">
            <RegisterConfirmForm
                onSuccess={() => {
                    navigate(`${paths.auth.registerContacts.getHref(redirectTo)}`, {
                        replace: true,
                    });
                }}
            />
        </AuthLayout>
    );
};

export default RegisterConfirmRoute;

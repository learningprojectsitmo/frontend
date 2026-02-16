import { useNavigate, useSearchParams } from "react-router";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { paths } from "@/config/paths";
import { RegistrationContactsForm } from "@/features/auth/components/registration-contacts-form";

const RegisterContactsRoute = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    return (
        <AuthLayout title="Создание нового аккаунта">
            <RegistrationContactsForm
                onSuccess={() => {
                    navigate(`${redirectTo ? `${redirectTo}` : paths.app.spases.getHref()}`, {
                        replace: true,
                    });
                }}
            />
        </AuthLayout>
    );
};

export default RegisterContactsRoute;

import { useNavigate, useSearchParams } from "react-router";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { paths } from "@/config/paths";
import { LoginForm } from "@/features/auth/components/login-form";

const RegisterRoute = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    return (
        <AuthLayout title="Создание нового аккаунта">
            <LoginForm
                onSuccess={() => {
                    navigate(
                        `${redirectTo ? `${redirectTo}` : paths.auth.registerContacts.getHref()}`,
                        {
                            replace: true,
                        },
                    );
                }}
            />
        </AuthLayout>
    );
};

export default RegisterRoute;

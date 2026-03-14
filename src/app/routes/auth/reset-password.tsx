import { useNavigate, useSearchParams } from "react-router";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { paths } from "@/config/paths";
import { ResetPasswordForm } from "@/features/auth/components/reset-password-form";

const ResetPasswordRoute = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    return (
        <AuthLayout title="Создание нового пароля">
            <ResetPasswordForm
                onSuccess={() => {
                    navigate(paths.auth.login.getHref(redirectTo), {
                        replace: true,
                    });
                }}
            />
        </AuthLayout>
    );
};

export default ResetPasswordRoute;

import { useNavigate, useSearchParams } from "react-router";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { paths } from "@/config/paths";
import { RegisterNameForm } from "@/features/auth/components/register-name-form";

const RegisterNameRoute = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    return (
        <AuthLayout title="Создание нового аккаунта" redirectIfAuthed={false}>
            <RegisterNameForm
                onSuccess={() => {
                    navigate(`${paths.auth.registerContacts.getHref(redirectTo)}`, {
                        replace: true,
                    });
                }}
            />
        </AuthLayout>
    );
};

export default RegisterNameRoute;

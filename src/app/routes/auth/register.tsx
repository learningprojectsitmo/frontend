import { AuthLayout } from "@/components/layouts/auth-layout";
import { RegistrationForm } from "@/features/auth/components/registration-form";

const RegisterRoute = () => {

    return (
        <AuthLayout title="Создание нового аккаунта">
            <RegistrationForm/>
        </AuthLayout>
    );
};

export default RegisterRoute;

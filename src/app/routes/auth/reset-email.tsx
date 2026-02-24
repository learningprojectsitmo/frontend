import { AuthLayout } from "@/components/layouts/auth-layout";
import { ResetEmailForm } from "@/features/auth/components/reset-email-form";

const ResetEmailRoute = () => {
    return (
        <AuthLayout title="Сброс пароля">
            <ResetEmailForm />
        </AuthLayout>
    );
};

export default ResetEmailRoute;

import { Navigate, useNavigate } from "react-router";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { paths } from "@/config/paths";
import { Spinner } from "@/components/ui/spinner/spinner";
import { useUser } from "@/lib/auth";
import { LoginForm } from "@/features/auth/components/login-form";

const LoginRoute = () => {
    const { data: user, isLoading } = useUser();
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (user) {
        return <Navigate to={paths.app.spaces.getHref()} replace />;
    }

    return (
        <AuthLayout title="Log in to your account">
            <LoginForm
                onSuccess={() => {
                    navigate(paths.app.spaces.getHref(), { replace: true });
                }}
            />
        </AuthLayout>
    );
};

export default LoginRoute;

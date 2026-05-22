import { Navigate, useNavigate, useSearchParams } from "react-router";

import { AuthLayout } from "@/components/layouts/auth-layout";
import { paths } from "@/config/paths";
import { Spinner } from "@/components/ui/spinner/spinner";
import { useUser } from "@/lib/auth";
import { LoginForm } from "@/features/auth/components/login-form";

const LoginRoute = () => {
    const { data: user, isLoading } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Spinner size="lg" />
            </div>
        );
    }

    if (user) {
        return <Navigate to={redirectTo || paths.app.spaces.getHref()} replace />;
    }

    return (
        <AuthLayout title="Log in to your account">
            <LoginForm
                onSuccess={() => {
                    navigate(`${redirectTo ? `${redirectTo}` : paths.app.spaces.getHref()}`, {
                        replace: true,
                    });
                }}
            />
        </AuthLayout>
    );
};

export default LoginRoute;

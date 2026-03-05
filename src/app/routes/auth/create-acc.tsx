import { AuthLayout } from "@/components/layouts/auth-layout";
import { CreateAccForm } from "@/features/auth/components/create-acc-form";

const CreateAccRoute = () => {
    return (
        <AuthLayout title="Создание нового аккаунта">
            <CreateAccForm />
        </AuthLayout>
    );
};

export default CreateAccRoute;

import { Navigate, Outlet } from "react-router";
import { Head } from "@/components/seo";
import { Spinner } from "@/components/ui/spinner/spinner";
import { AdminNav } from "@/features/admin/components/admin-nav";
import { paths } from "@/config/paths";
import { useProfile } from "@/lib/profile";

const AdminLayout = () => {
    const { data: profile, isLoading } = useProfile();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Spinner size="lg" />
            </div>
        );
    }

    if (!profile || profile.role !== "admin") {
        return <Navigate to={paths.app.root.getHref()} replace />;
    }

    return (
        <>
            <Head title="Админ-панель" />
            <AdminNav />
            <Outlet />
        </>
    );
};

export default AdminLayout;

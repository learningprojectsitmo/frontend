import { useState } from "react";
import { ContentLayout } from "@/components/layouts";
import { useSearchParams, Link } from "react-router";
import { useResumeDetail, useUpdateResume } from "@/lib/resume";
import { Spinner } from "@/components/ui/spinner/spinner";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";
import { ResumePage } from "@/features/resume/components/resume-page";

const ResumeRoute = () => {
    const [searchParams] = useSearchParams();
    const id = parseInt(searchParams.get("id") || "0", 10);
    const projectId = searchParams.get("projectId");

    const { data, isLoading, error } = useResumeDetail(id);
    const updateResumeMutation = useUpdateResume();

    const [isEditing, setIsEditing] = useState(false);

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async (fields: { role: string | null; about: string | null; cover_letter: string | null }) => {
        await updateResumeMutation.mutateAsync({ id, data: fields });
        setIsEditing(false);
    };

    if (isLoading) {
        return (
            <ContentLayout title="Резюме">
                <div className="flex items-center justify-center min-h-[calc(100vh-12rem)]">
                    <Spinner size="lg" />
                </div>
            </ContentLayout>
        );
    }

    if (error || !data) {
        return (
            <ContentLayout title="Резюме не найдено">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-lg">Резюме не найдено</p>
                </div>
            </ContentLayout>
        );
    }

    const fullName = [data.user.last_name, data.user.first_name, data.user.middle_name]
        .filter(Boolean)
        .join(" ");

    return (
        <ContentLayout title={`Резюме — ${fullName}`}>
            <div className="mx-auto max-w-[1200px] p-6 flex flex-col gap-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/app" className="font-sans font-medium text-[16px]">
                                    Все пространства
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        {projectId ? (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            to={`/app/project?id=${projectId}`}
                                            className="font-sans font-medium text-[16px]"
                                        >
                                            Проект
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        ) : (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    <BreadcrumbLink asChild>
                                        <Link
                                            to="/app/profile"
                                            className="font-sans font-medium text-[16px]"
                                        >
                                            Профиль
                                        </Link>
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </>
                        )}
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-[16px]">
                                Резюме — {fullName}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <ResumePage
                    data={data}
                    isEditing={isEditing}
                    onEdit={handleEdit}
                    onSave={handleSave}
                    onCancel={handleCancel}
                />
            </div>
        </ContentLayout>
    );
};

export default ResumeRoute;

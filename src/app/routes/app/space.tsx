import { ContentLayout } from "@/components/layouts";
import { useState } from "react";
import { useSearchParams } from "react-router";
import { Link } from "react-router";
import { SpaceHeader } from "@/features/spaces/components/space-header";
import { SpaceProjectList } from "@/features/spaces/components/space-project-list";
import { Spinner } from "@/components/ui/spinner/spinner";
import { SpaceSettingsModal } from "@/features/spaces/components/space-settings-modal";
import { ShareSpaceModal } from "@/features/spaces/components/share-space-modal";
import { useSpacesList } from "@/lib/spaces";
import { useProjectsList } from "@/lib/projects";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb/breadcrumb";

const SpaceRoute = () => {
    const [searchParams] = useSearchParams();
    const urlId = searchParams.get("id") || "";

    const { data: dataSpaces, isLoading: isSpacesLoading } = useSpacesList();
    const { data: dataProjects, isLoading: isProjectsLoading, isError } = useProjectsList(urlId);

    const [settingsOpen, setSettingsOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    const spaceData = dataSpaces?.spaces.find((space) => String(space.id) === urlId);

    if (!spaceData) {
        if (isSpacesLoading) {
            return (
                <div className="flex items-center justify-center h-screen">
                    <Spinner size="lg" />
                </div>
            );
        }
        return (
            <ContentLayout title="Пространство не найдено">
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-500 text-lg">Пространство не найдено</p>
                </div>
            </ContentLayout>
        );
    }

    return (
        <ContentLayout title={spaceData.title}>
            <div className="mx-auto max-w-7xl p-6 flex flex-col gap-6">
                <Breadcrumb className="h-[34px] flex align-center">
                    <BreadcrumbList>
                        <BreadcrumbItem>
                            <BreadcrumbLink asChild>
                                <Link to="/app" className="font-sans font-medium text-[16px]">
                                    Все пространства
                                </Link>
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <BreadcrumbPage className="font-sans font-medium text-[16px]">
                                {spaceData.title}
                            </BreadcrumbPage>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>

                <SpaceHeader
                    spaceData={spaceData}
                    role={(dataSpaces as { role?: string })?.role}
                    onSettingsOpen={() => setSettingsOpen(true)}
                    onShareOpen={() => setShareOpen(true)}
                />

                <SpaceProjectList
                    projects={dataProjects?.items || []}
                    total={dataProjects?.total || 0}
                    isLoading={isProjectsLoading}
                    isError={isError}
                />
            </div>

            <SpaceSettingsModal
                open={settingsOpen}
                onOpenChange={setSettingsOpen}
                space={spaceData}
            />
            <ShareSpaceModal open={shareOpen} onOpenChange={setShareOpen} spaceId={spaceData.id} />
        </ContentLayout>
    );
};

export default SpaceRoute;

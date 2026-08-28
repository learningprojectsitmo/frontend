import { useProfileSpaces } from "@/features/profile/api/use-profile-data";
import { SpacesCard } from "@/components/ui/card/spaces-card";
import { Link } from "react-router";
import { paths } from "@/config/paths";

export function SpacesSection() {
    const { data: spaces, isLoading } = useProfileSpaces();

    if (isLoading) {
        return (
            <div>
                <h2 className="text-lg font-semibold text-app-text mb-6">Мои пространства</h2>
                <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-2 border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    const items = spaces ?? [];

    if (items.length === 0) {
        return (
            <div>
                <h2 className="text-lg font-semibold text-app-text mb-6">Мои пространства</h2>
                <div className="text-center py-16 text-[14px] text-gray-500">
                    У вас пока нет пространств
                </div>
            </div>
        );
    }

    return (
        <div>
            <h2 className="text-lg font-semibold text-app-text mb-6">Мои пространства</h2>
            <div className="grid gap-6 grid-cols-[repeat(auto-fill,minmax(320px,1fr))]">
                {items.map((space) => (
                    <Link
                        key={space.id}
                        to={paths.app.space.getHref(space.id)}
                        className="block h-full"
                    >
                        <SpacesCard
                            iconName="discipline"
                            tag={space.role === "Owner" ? "Владелец" : "Участник"}
                            tagVariant={space.role === "Owner" ? "success" : "info"}
                            title={space.name}
                            description={space.description}
                            firstMetricText={`${space.projectsCount} проектов`}
                            secondMetricText={`${space.membersCount} участника`}
                        />
                    </Link>
                ))}
            </div>
        </div>
    );
}

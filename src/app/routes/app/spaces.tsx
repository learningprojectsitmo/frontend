import { ContentLayout } from "@/components/layouts";
import { BookOpen, Users, LayoutGrid, Settings } from "lucide-react";
import { PlusButton } from "@/components/ui/plus-button";

const spaseRoute = () => {
    // Имитация данных из макета (в будущем придет из API)
    const spaces = [
        {
            title: "Управление проектами",
            projects: 8,
            members: 24,
            color: "bg-blue-500",
            category: "Дисциплина",
        },
        {
            title: "Проектная деятельность",
            projects: 5,
            members: 12,
            color: "bg-indigo-500",
            category: "Дисциплина",
        },
        {
            title: "Управление процессами",
            projects: 12,
            members: 128,
            color: "bg-red-500",
            category: "Дисциплина",
        },
    ];

    return (
        <ContentLayout title="Все пространства">
            <div className="mx-auto max-w-7xl p-6">
                {/* Header Section */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="mb-1 text-2xl font-bold text-gray-900">Все пространства</h1>
                        <p className="text-sm text-gray-500">
                            Управляйте своими образовательными проектами и инициативами
                        </p>
                    </div>
                    <PlusButton label="Создать проект" />
                </div>

                {/* Spaces Grid */}
                <section className="mb-12">
                    <h2 className="mb-4 text-lg font-semibold text-gray-800">Ваши пространства</h2>
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {spaces.map((space, idx) => (
                            <div
                                key={idx}
                                className="border border-gray-100 bg-white rounded-xl p-6 shadow-sm transition-shadow hover:shadow-md"
                            >
                                <div className="mb-4 flex items-start justify-between">
                                    <div className={`${space.color} rounded-lg p-3 text-white`}>
                                        <BookOpen size={24} />
                                    </div>
                                    <span className="border bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500 rounded">
                                        {space.category}
                                    </span>
                                </div>

                                <h3 className="mb-2 text-lg font-bold">{space.title}</h3>
                                <p className="mb-6 leading-relaxed text-sm text-gray-500">
                                    Проекты по планированию, организации и контролю проектной
                                    работы...
                                </p>

                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <div className="flex items-center gap-1.5">
                                        <LayoutGrid size={16} />
                                        <span>{space.projects} проектов</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Users size={16} />
                                        <span>{space.members} участника</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Recent Projects Section (Simplified) */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-800">Недавние проекты</h2>
                        <div className="flex gap-2">
                            <button className="rounded-md bg-gray-100 p-2">
                                <LayoutGrid size={18} />
                            </button>
                            <button className="p-2 text-gray-400">
                                <Settings size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 font-bold text-blue-600">
                                AI
                            </div>
                            <div>
                                <h4 className="font-medium">AI Learning Platform</h4>
                                <p className="text-xs font-normal text-gray-400">
                                    Разработка цифровой платформы с ИИ
                                </p>
                            </div>
                        </div>
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-600">
                            В РАБОТЕ
                        </span>
                    </div>
                </section>
            </div>
        </ContentLayout>
    );
};

export default spaseRoute;

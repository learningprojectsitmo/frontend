import { useNavigate } from "react-router";
import { Head } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";
import { useUser } from "@/lib/auth";

const features = [
    {
        title: "Пространства по интересам",
        description:
            "Создавайте и находите проекты по дисциплинам, тегам и направлениям. Каждый проект — новое приключение.",
        icon: "project" as const,
    },
    {
        title: "Поиск команды",
        description:
            "Приглашайте участников по ссылке, назначайте роли. Собирайте команду единомышленников для любого проекта.",
        icon: "members" as const,
    },
    {
        title: "Канбан для задач",
        description:
            "Drag-and-drop доски с колонками, WIP-лимитами, приоритетами и подзадачами. Всё, чтобы не упустить детали.",
        icon: "list" as const,
    },
    {
        title: "Профиль-портфолио",
        description:
            "Резюме, портфолио, языки, образование — покажите себя и найдите проект под свои навыки.",
        icon: "profile" as const,
    },
    {
        title: "Гибкие роли и права",
        description:
            "Настройте доступ к проекту: кто что видит, кто что может менять. Полный контроль над пространством.",
        icon: "settings" as const,
    },
    {
        title: "Статистика и аудит",
        description:
            "Отслеживайте прогресс команды, смотрите историю изменений, анализируйте загрузку участников.",
        icon: "filter" as const,
    },
];

const FeatureCard = ({
    title,
    description,
    icon,
    index: _index,
}: (typeof features)[0] & { index: number }) => (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-lg cursor-default hover:-translate-y-1 transition-all duration-300">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
            <Icon name={icon} size={20} />
        </div>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">{description}</p>
    </div>
);

const LandingRoute = () => {
    const navigate = useNavigate();
    const { data: user, isLoading } = useUser();
    const isLoggedIn = !isLoading && user;

    return (
        <>
            <Head description="Платформа для поиска команды и создания проектов" title="EduFlow" />

            {/* Header */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <Icon name="logo-edu-flow" width={100} height={28} alt="EduFlow" />
                </div>
                <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                        <Button
                            variant="dark"
                            size="hug36"
                            className="text-[13px] font-semibold rounded-xl"
                            onClick={() => navigate(paths.app.spaces.getHref())}
                        >
                            Перейти в приложение
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                size="hug36"
                                className="text-[13px] font-semibold rounded-xl"
                                onClick={() => navigate(paths.auth.login.getHref())}
                            >
                                Войти
                            </Button>
                            <Button
                                variant="dark"
                                size="hug36"
                                className="text-[13px] font-semibold rounded-xl"
                                onClick={() => navigate(paths.auth.createAcc.getHref())}
                            >
                                Регистрация
                            </Button>
                        </>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <div className="bg-[#F9FAFB]">
                <div className="mx-auto max-w-7xl px-6 py-20 sm:py-28 text-center">
                    <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight animate-fade-in-up">
                        Найди команду и создай
                        <br />
                        проект мечты
                    </h1>
                    <p
                        className="mx-auto mt-4 max-w-2xl text-base sm:text-lg text-gray-500 leading-relaxed animate-fade-in-up"
                        style={{ animationDelay: "0.15s", opacity: 0 }}
                    >
                        Платформа, где студенты, преподаватели и все желающие объединяются в
                        команды, находят единомышленников и воплощают свои проектные идеи в жизнь.
                    </p>
                    <div
                        className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
                        style={{ animationDelay: "0.3s", opacity: 0 }}
                    >
                        {isLoggedIn ? (
                            <Button
                                size="hug48"
                                variant="dark"
                                className="text-[15px] font-semibold rounded-xl"
                                onClick={() => navigate(paths.app.spaces.getHref())}
                            >
                                Перейти в приложение
                            </Button>
                        ) : (
                            <>
                                <Button
                                    size="hug48"
                                    variant="dark"
                                    className="text-[15px] font-semibold rounded-xl"
                                    onClick={() => navigate(paths.auth.createAcc.getHref())}
                                >
                                    Найти команду
                                </Button>
                                <Button
                                    variant="outline"
                                    size="hug48"
                                    className="text-[15px] font-semibold rounded-xl"
                                    onClick={() => navigate(paths.auth.login.getHref())}
                                >
                                    Создать проект
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* For Whom Section */}
            <div className="bg-white py-20">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Для студентов и преподавателей
                        </h2>
                        <p className="mt-3 text-base text-gray-500">
                            Каждый найдёт своё место в сообществе
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 animate-fade-in-left">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
                                <Icon name="profile" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Для студентов</h3>
                            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                                Ищете команду для курсового или стартапа? Создавайте профиль с
                                резюме и портфолио, находите проекты по интересам и собирайте
                                команду мечты.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 animate-fade-in-right">
                            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-900">
                                <Icon name="university" size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">Для преподавателей</h3>
                            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
                                Хотите организовать проектную деятельность? Создавайте пространства
                                для групп, отслеживайте прогресс через канбан-доски, управляйте
                                ролями и правами участников.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="bg-[#F9FAFB] py-16">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-14">
                        <h2 className="text-3xl font-bold text-gray-900">
                            Всё для работы над проектом
                        </h2>
                        <p className="mt-3 text-base text-gray-500">
                            Инструменты, которые помогают командам делать проекты
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} index={index} />
                        ))}
                    </div>
                </div>
            </div>

            {/* Community Stats */}
            <div className="bg-white py-16">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-bold text-gray-900">Сообщество растёт</h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: "15+", label: "Пространств" },
                            { number: "50+", label: "Проектов" },
                            { number: "200+", label: "Участников" },
                            { number: "500+", label: "Выполненных задач" },
                        ].map((stat) => (
                            <div key={stat.label}>
                                <p className="text-3xl sm:text-4xl font-bold text-gray-900">
                                    {stat.number}
                                </p>
                                <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-gray-900 py-20">
                <div className="mx-auto max-w-7xl px-6 text-center">
                    <h2 className="text-3xl font-bold text-white">Стань частью сообщества</h2>
                    <p className="mt-3 text-base text-gray-400 max-w-xl mx-auto">
                        Присоединяйтесь к студентам и преподавателям, которые уже нашли команду и
                        работают над своими проектами.
                    </p>
                    <div className="mt-8">
                        <Button
                            size="hug56"
                            className="bg-white text-gray-900 hover:bg-gray-100 text-[15px] font-semibold rounded-xl"
                            onClick={() =>
                                navigate(
                                    isLoggedIn
                                        ? paths.app.spaces.getHref()
                                        : paths.auth.createAcc.getHref(),
                                )
                            }
                        >
                            {isLoggedIn ? "Перейти в приложение" : "Найти свою команду"}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Icon name="logo-edu-flow" width={80} height={22} alt="EduFlow" />
                    </div>
                    <p className="text-sm text-gray-400">
                        &copy; {new Date().getFullYear()} EduFlow. Все права защищены.
                    </p>
                    <div className="flex gap-4 text-sm text-gray-400">
                        <a href="#" className="hover:text-gray-600 transition-colors">
                            Политика конфиденциальности
                        </a>
                        <a href="#" className="hover:text-gray-600 transition-colors">
                            Контакты
                        </a>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default LandingRoute;

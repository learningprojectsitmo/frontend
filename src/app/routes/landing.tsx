import { useNavigate } from "react-router";
import { Head } from "@/components/seo";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export interface Role {
    nameRole: string;
    responsibilities: string[];
    numberOfMembers: number;
}

const features = [
    {
        title: "Управление проектами",
        description: "Создавайте, редактируйте и отслеживайте прогресс ваших учебных проектов",
        icon: (
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
            </svg>
        ),
    },
    {
        title: "Командная работа",
        description: "Приглашайте участников, назначайте роли и работайте вместе",
        icon: (
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
            </svg>
        ),
    },
    {
        title: "Отслеживание прогресса",
        description: "Следите за выполнением задач и достижением целей",
        icon: (
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
            </svg>
        ),
    },
    {
        title: "Обратная связь",
        description: "Получайте комментарии и оценки от преподавателей",
        icon: (
            <svg className="size-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                />
            </svg>
        ),
    },
];

const FeatureCard = ({ title, description, icon }: (typeof features)[0]) => (
    <motion.div
        whileHover={{ scale: 1.05 }}
        className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
    >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300">
            {icon}
        </div>
        <h3 className="mb-2 text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </motion.div>
);

const LandingRoute = () => {
    const navigate = useNavigate();

    const handleStart = () => navigate("/auth/login");

    return (
        <>
            <Head
                description="Платформа для управления учебными проектами"
                title="Learning Projects"
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background">
                <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl"
                    >
                        <span className="block">Learning Projects</span>
                        <span className="block text-primary">
                            Платформа для{" "}
                            <span className="underline decoration-primary/50">
                                учебных проектов
                            </span>
                        </span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="mx-auto mt-3 max-w-md text-base text-muted-foreground sm:text-lg md:mt-5 md:max-w-3xl"
                    >
                        Создавайте, управляйте и развивайте свои учебные проекты вместе с командой.
                        Отслеживайте прогресс, получайте обратную связь и достигайте целей.
                    </motion.p>
                    <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Button
                            size="fixed48"
                            variant="dark"
                            className="transform transition-transform hover:scale-105"
                            onClick={handleStart}
                        >
                            Начать работу
                        </Button>
                        <Button
                            variant="outline"
                            size="fixed48"
                            onClick={() => navigate("/auth/register")}
                        >
                            Регистрация
                        </Button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-16 bg-background">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold tracking-tight text-foreground">
                            Возможности платформы
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Всё необходимое для эффективной работы над учебными проектами
                        </p>
                    </div>
                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                        {features.map((feature, index) => (
                            <FeatureCard key={index} {...feature} />
                        ))}
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="bg-primary/5 py-16">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-foreground">
                        Готовы начать?
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        Присоединяйтесь к{" "}
                        <span className="font-semibold text-foreground">
                            1,000+ студентов и преподавателей
                        </span>
                        , уже использующих платформу
                    </p>
                    <div className="mt-8">
                        <Button
                            size="hug56"
                            variant="dark"
                            className="transform transition-transform hover:scale-105"
                            onClick={handleStart}
                        >
                            Зарегистрироваться бесплатно
                        </Button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-center items-center gap-4">
                    <span>
                        &copy; {new Date().getFullYear()} Learning Projects. Все права защищены.
                    </span>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-primary transition-colors">
                            Политика конфиденциальности
                        </a>
                        <a href="#" className="hover:text-primary transition-colors">
                            Связаться с нами
                        </a>
                    </div>
                </div>
            </footer>
        </>
    );
};

export default LandingRoute;

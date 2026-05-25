import { useMemo, useState, useCallback } from "react";
import type { Idea, IdeaTag, IdeasSort, IdeaStatus } from "../types";

const mockAuthors = [
    { id: 1, username: "alex_dev", avatarUrl: "" },
    { id: 2, username: "maria_design", avatarUrl: "" },
    { id: 3, username: "ivan_cloud", avatarUrl: "" },
    { id: 4, username: "elena_pm", avatarUrl: "" },
    { id: 5, username: "dmitry_fullstack", avatarUrl: "" },
    { id: 6, username: "olga_qa", avatarUrl: "" },
];

const mockIdeas: Idea[] = [
    { id: 1, title: "Надоела ваша темная тема", description: "Хотелось бы видеть нормальную светлую тему в интерфейсе панели управления. Тёмная тема выглядит красиво, но не всегда удобна при дневном свете. Добавьте возможность переключаться между темами.", votes: 42, userVote: null, commentsCount: 15, tags: ["Панель управления", "UI/UX"], status: "new", author: mockAuthors[0], createdAt: "2026-05-20T10:00:00Z" },
    { id: 2, title: "Двухфакторная аутентификация", description: "Очень не хватает 2FA для защиты аккаунта. Многие конкуренты уже давно добавили эту возможность. Было бы здорово видеть поддержку TOTP и уведомлений в Telegram.", votes: 38, userVote: null, commentsCount: 23, tags: ["Аккаунт", "Безопасность"], status: "planned", author: mockAuthors[2], createdAt: "2026-05-19T14:30:00Z" },
    { id: 3, title: "Мониторинг расходов в реальном времени", description: "Добавьте дашборд с графиками расходов по проектам, чтобы видеть затраты в моменте. Сейчас приходится ждать отчётов в конце месяца, это неудобно.", votes: 31, userVote: null, commentsCount: 8, tags: ["Мониторинг", "Биллинг"], status: "new", author: mockAuthors[4], createdAt: "2026-05-18T09:15:00Z" },
    { id: 4, title: "API для управления DNS-записями", description: "Нужен полноценный REST API для управления DNS-записями доменов. Хочется автоматизировать добавление/удаление записей через CI/CD пайплайны.", votes: 27, userVote: null, commentsCount: 12, tags: ["API", "Домены"], status: "implemented", author: mockAuthors[1], createdAt: "2026-05-17T16:45:00Z" },
    { id: 5, title: "Командные проекты в одном пространстве", description: "Сделайте возможность создавать подпроекты внутри пространства с разными доступными участниками. Чтобы можно было разграничить доступ к разным частям большого проекта.", votes: 24, userVote: null, commentsCount: 19, tags: ["Проекты", "Команда"], status: "new", author: mockAuthors[3], createdAt: "2026-05-16T11:20:00Z" },
    { id: 6, title: "Интеграция с GitLab CI/CD", description: "Добавьте возможность деплоить приложения через GitLab CI. Сейчас есть интеграция с GitHub Actions, а GitLab — не менее популярный инструмент.", votes: 19, userVote: null, commentsCount: 6, tags: ["Интеграции", "CI/CD"], status: "planned", author: mockAuthors[5], createdAt: "2026-05-15T08:00:00Z" },
    { id: 7, title: "Автоматическое масштабирование БД", description: "Хотелось бы видеть автоматическое масштабирование баз данных при росте нагрузки. Ручное увеличение ресурсов отнимает время, хочется чтобы система сама адаптировалась.", votes: 17, userVote: null, commentsCount: 4, tags: ["Базы данных", "Мониторинг"], status: "declined", author: mockAuthors[0], createdAt: "2026-05-14T13:30:00Z" },
    { id: 8, title: "Уведомления о превышении бюджета", description: "Добавьте возможность настраивать пороги бюджета по проектам и получать уведомления при их превышении. Сейчас легко пропустить момент и получить большой счёт.", votes: 15, userVote: null, commentsCount: 7, tags: ["Биллинг", "Уведомления"], status: "new", author: mockAuthors[2], createdAt: "2026-05-13T10:10:00Z" },
    { id: 9, title: "Тёмная тема для мобильного приложения", description: "В мобильном приложении пока нет тёмной темы. Использую телефон вечером — глаза устают от яркого экрана. Добавьте хотя бы базовую поддержку.", votes: 12, userVote: null, commentsCount: 3, tags: ["UI/UX", "Мобильное приложение"], status: "new", author: mockAuthors[4], createdAt: "2026-05-12T17:00:00Z" },
    { id: 10, title: "Экспорт логов в SIEM-системы", description: "Необходима возможность экспортировать логи в популярные SIEM-системы (Splunk, ELK, Wazuh). Это требование безопасности для многих корпоративных клиентов.", votes: 10, userVote: null, commentsCount: 5, tags: ["Мониторинг", "Безопасность"], status: "new", author: mockAuthors[1], createdAt: "2026-05-11T09:30:00Z" },
    { id: 11, title: "Улучшенный редактор Kubernetes манифестов", description: "Текущий редактор в панели управления неудобен — нет подсветки синтаксиса YAML и autocomplete. Добавьте хотя бы базовый редактор с валидацией.", votes: 8, userVote: null, commentsCount: 2, tags: ["Kubernetes", "Панель управления"], status: "new", author: mockAuthors[5], createdAt: "2026-05-10T14:00:00Z" },
    { id: 12, title: "Гибкие правила для firewall", description: "Нужна возможность создавать кастомные правила файрвола с географической привязкой и временными ограничениями. Например, блокировать трафик из определённых стран в ночное время.", votes: 7, userVote: null, commentsCount: 9, tags: ["Сеть", "Безопасность"], status: "planned", author: mockAuthors[3], createdAt: "2026-05-09T11:15:00Z" },
];

export const mockTags: IdeaTag[] = [
    { id: 1, name: "Облачные серверы", count: 5 },
    { id: 2, name: "App Platform", count: 3 },
    { id: 3, name: "Панель управления", count: 4 },
    { id: 4, name: "Базы данных", count: 6 },
    { id: 5, name: "Домены", count: 3 },
    { id: 6, name: "Сеть", count: 4 },
    { id: 7, name: "Безопасность", count: 5 },
    { id: 8, name: "Мониторинг", count: 4 },
    { id: 9, name: "Биллинг", count: 3 },
    { id: 10, name: "UI/UX", count: 7 },
    { id: 11, name: "API", count: 5 },
    { id: 12, name: "Интеграции", count: 4 },
    { id: 13, name: "CI/CD", count: 2 },
    { id: 14, name: "Kubernetes", count: 3 },
    { id: 15, name: "Команда", count: 2 },
];

const statusLabels: Record<IdeaStatus, string> = {
    new: "Новые идеи",
    planned: "Запланировано",
    declined: "Отклонено",
    implemented: "Реализовано",
};

export function getStatusLabel(status: IdeaStatus): string {
    return statusLabels[status];
}

export function useIdeasList() {
    const [search, setSearch] = useState("");
    const [sort, setSort] = useState<IdeasSort>("newest");
    const [statusFilter, setStatusFilter] = useState<IdeaStatus | "all">("all");
    const [tagFilter, setTagFilter] = useState<string | null>(null);
    const [showOnlyMine, setShowOnlyMine] = useState(false);
    const [ideas, setIdeas] = useState<Idea[]>(mockIdeas);
    const [showAllTags, setShowAllTags] = useState(false);

    const toggleVote = useCallback((ideaId: number, direction: "up" | "down") => {
        setIdeas((prev) =>
            prev.map((idea) => {
                if (idea.id !== ideaId) return idea;
                if (idea.userVote === direction) {
                    return {
                        ...idea,
                        userVote: null,
                        votes: idea.votes + (direction === "up" ? -1 : 1),
                    };
                }
                const voteDiff = direction === "up" ? 1 : -1;
                const undoDiff = idea.userVote === "up" ? -1 : idea.userVote === "down" ? 1 : 0;
                return { ...idea, userVote: direction, votes: idea.votes + voteDiff + undoDiff };
            }),
        );
    }, []);

    const addIdea = useCallback((title: string, description: string, tags: string[]) => {
        const newIdea: Idea = {
            id: Date.now(),
            title,
            description,
            votes: 0,
            userVote: null,
            commentsCount: 0,
            tags,
            status: "new",
            author: { id: 0, username: "you", avatarUrl: "" },
            createdAt: new Date().toISOString(),
        };
        setIdeas((prev) => [newIdea, ...prev]);
    }, []);

    const filtered = useMemo(() => {
        let result = [...ideas];

        if (statusFilter !== "all") {
            result = result.filter((i) => i.status === statusFilter);
        }
        if (showOnlyMine) {
            result = result.filter((i) => i.author.id === 0);
        }
        if (tagFilter) {
            result = result.filter((i) => i.tags.includes(tagFilter));
        }
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(
                (i) =>
                    i.title.toLowerCase().includes(q) ||
                    i.description.toLowerCase().includes(q),
            );
        }
        if (sort === "newest") {
            result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        } else {
            result.sort((a, b) => b.votes - a.votes);
        }
        return result;
    }, [ideas, statusFilter, showOnlyMine, tagFilter, search, sort]);

    const filteredTags = useMemo(() => {
        if (showAllTags) return mockTags;
        return mockTags.slice(0, 10);
    }, [showAllTags]);

    return {
        ideas: filtered,
        tags: filteredTags,
        totalTags: mockTags.length,
        showAllTags,
        setShowAllTags,
        search,
        setSearch,
        sort,
        setSort,
        statusFilter,
        setStatusFilter,
        tagFilter,
        setTagFilter,
        showOnlyMine,
        setShowOnlyMine,
        toggleVote,
        addIdea,
    };
}

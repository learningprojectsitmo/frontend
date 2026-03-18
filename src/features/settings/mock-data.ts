// features/settings/data/mock-data.ts
// features/settings/data/mock-data.ts
import type { Role, Permission } from "./types";

// Моковые роли
export const mockRoles: Role[] = [
    { id: "1", name: "Администратор", description: "Полный доступ ко всем функциям", userCount: 3 },
    {
        id: "2",
        name: "Менеджер проекта",
        description: "Управление проектами и задачами",
        userCount: 8,
    },
    {
        id: "3",
        name: "Студент",
        description: "Доступ к учебным материалам и заданиям",
        userCount: 15,
    },
    { id: "4", name: "Преподаватель", description: "Создание и оценка заданий", userCount: 5 },
    { id: "5", name: "Ассистент", description: "Помощь в проверке заданий", userCount: 4 },
];

// Моковые разделы системы
export const systemSections = [
    { id: "1", name: "Настройка доступа" },
    { id: "2", name: "Системные настройки" },
    { id: "3", name: "Управление группами" },
    { id: "4", name: "Управление проектами" },
    { id: "5", name: "Резюме и профили" },
    { id: "6", name: "Пространства" },
    { id: "7", name: "Участники команды" },
    { id: "8", name: "Отчеты и аналитика" },
];

// Моковые разрешения для каждой роли
export const mockRolePermissions: Record<string, Permission[]> = {
    "1": systemSections.map((section) => ({
        id: `perm-${section.id}`,
        sectionId: section.id,
        sectionName: section.name,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canView: true,
    })),
    "2": systemSections.map((section) => ({
        id: `perm-${section.id}`,
        sectionId: section.id,
        sectionName: section.name,
        canAdd: section.id === "4" || section.id === "6",
        canEdit: section.id === "4" || section.id === "6",
        canDelete: false,
        canView: true,
    })),
    "3": systemSections.map((section) => ({
        id: `perm-${section.id}`,
        sectionId: section.id,
        sectionName: section.name,
        canAdd: false,
        canEdit: false,
        canDelete: false,
        canView: section.id === "4" || section.id === "5" || section.id === "6",
    })),
    "4": systemSections.map((section) => ({
        id: `perm-${section.id}`,
        sectionId: section.id,
        sectionName: section.name,
        canAdd: section.id === "4" || section.id === "5",
        canEdit: section.id === "4" || section.id === "5",
        canDelete: false,
        canView: true,
    })),
    "5": systemSections.map((section) => ({
        id: `perm-${section.id}`,
        sectionId: section.id,
        sectionName: section.name,
        canAdd: false,
        canEdit: section.id === "5",
        canDelete: false,
        canView: section.id === "4" || section.id === "5",
    })),
};

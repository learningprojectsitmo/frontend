// constants/spaces.ts
export enum CategoryName {
    DISCIPLINES = "Дисциплины",
    PROJECTS = "Проекты",
    TEAMS = "Команды",
}

export enum SpaceColor {
    BLUE = "bg-blue-500",
    GREEN = "bg-green-500",
    PURPLE = "bg-purple-500",
}

export type SpaceColorOption = { value: string; label: string };

export const SPACE_COLOR_OPTIONS: SpaceColorOption[] = [
    { value: "bg-blue-500", label: "Синий" },
    { value: "bg-green-500", label: "Зелёный" },
    { value: "bg-purple-500", label: "Фиолетовый" },
    { value: "bg-red-500", label: "Красный" },
    { value: "bg-yellow-500", label: "Жёлтый" },
    { value: "bg-pink-500", label: "Розовый" },
];

export const baseColor = {
    white: {
        bg: "bg-app-surface",
        header: "bg-[hsl(218,45%,94%)] dark:bg-app-ghost",
        text: "text-gray-900",
        border: "border-gray-300",
        label: "Белый",
    },
} as const;

export const columnColors = {
    red: {
        bg: "bg-red-100 dark:bg-red-950/40",
        header: "bg-red-200 dark:bg-red-900",
        text: "text-gray-900",
        border: "border-red-200",
        label: "Красный",
    },
    orange: {
        bg: "bg-orange-100 dark:bg-orange-950/40",
        header: "bg-orange-200 dark:bg-orange-900",
        text: "text-gray-900",
        border: "border-orange-200",
        label: "Оранжевый",
    },
    yellow: {
        bg: "bg-yellow-100 dark:bg-yellow-950/40",
        header: "bg-yellow-200 dark:bg-yellow-900",
        text: "text-gray-900",
        border: "border-yellow-200",
        label: "Жёлтый",
    },
    green: {
        bg: "bg-green-100 dark:bg-green-950/40",
        header: "bg-green-200 dark:bg-green-900",
        text: "text-gray-900",
        border: "border-green-200",
        label: "Зелёный",
    },
    teal: {
        bg: "bg-teal-100 dark:bg-teal-950/40",
        header: "bg-teal-200 dark:bg-teal-900",
        text: "text-gray-900",
        border: "border-teal-200",
        label: "Бирюзовый",
    },
    blue: {
        bg: "bg-blue-100 dark:bg-blue-950/40",
        header: "bg-blue-200 dark:bg-blue-900",
        text: "text-gray-900",
        border: "border-blue-200",
        label: "Синий",
    },
    purple: {
        bg: "bg-purple-100 dark:bg-purple-950/40",
        header: "bg-purple-200 dark:bg-purple-900",
        text: "text-gray-900",
        border: "border-purple-200",
        label: "Фиолетовый",
    },
    darkRed: {
        bg: "bg-red-100 dark:bg-red-950/40",
        header: "bg-red-500 dark:bg-red-800",
        text: "text-white",
        border: "border-red-200",
        label: "Тёмно-красный",
    },
    darkOrange: {
        bg: "bg-orange-100 dark:bg-orange-950/40",
        header: "bg-orange-500 dark:bg-orange-800",
        text: "text-white",
        border: "border-orange-200",
        label: "Тёмно-оранжевый",
    },
    darkYellow: {
        bg: "bg-yellow-100 dark:bg-yellow-950/40",
        header: "bg-yellow-500 dark:bg-yellow-800",
        text: "text-white",
        border: "border-yellow-200",
        label: "Тёмно-жёлтый",
    },
    darkGreen: {
        bg: "bg-green-100 dark:bg-green-950/40",
        header: "bg-green-500 dark:bg-green-800",
        text: "text-white",
        border: "border-green-200",
        label: "Тёмно-зелёный",
    },
    darkTeal: {
        bg: "bg-teal-100 dark:bg-teal-950/40",
        header: "bg-teal-500 dark:bg-teal-800",
        text: "text-white",
        border: "border-teal-200",
        label: "Тёмно-бирюзовый",
    },
    darkBlue: {
        bg: "bg-blue-100 dark:bg-blue-950/40",
        header: "bg-blue-500 dark:bg-blue-800",
        text: "text-white",
        border: "border-blue-200",
        label: "Тёмно-синий",
    },
    darkPurple: {
        bg: "bg-purple-100 dark:bg-purple-950/40",
        header: "bg-purple-500 dark:bg-purple-800",
        text: "text-white",
        border: "border-purple-200",
        label: "Тёмно-фиолетовый",
    },
} as const;

export const allColors = [
    ...Object.entries(columnColors).map(([key, styles]) => ({
        value: key,
        styles,
        label: styles.label,
    })),
    { value: "white", styles: baseColor.white, label: baseColor.white.label },
] as const;

export type AllColorKeys = (typeof allColors)[number]["value"];
export const allColorValues = allColors.map((c) => c.value) as AllColorKeys[];

export const priorityColors = {
    low: "bg-green-200 text-green-700 dark:bg-green-950/60 dark:text-green-300",
    medium: "bg-yellow-200 text-yellow-700 dark:bg-yellow-950/60 dark:text-yellow-300",
    high: "bg-orange-200 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300",
    urgent: "bg-red-200 text-red-700 dark:bg-red-950/60 dark:text-red-300",
} as const;

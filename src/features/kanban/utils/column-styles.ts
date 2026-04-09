export const baseColor = {
    white: {
        bg: 'bg-white',
        header: 'bg-white',
        text: 'text-gray-900',
        border: 'border-gray-300',
        label: 'Белый',
    },
} as const;

export const columnColors = {
    red: {
        bg: 'bg-red-100',
        header: 'bg-red-200',
        text: 'text-gray-900',
        border: 'border-red-200',
        label: 'Красный',
    },
    orange: {
        bg: 'bg-orange-100',
        header: 'bg-orange-200',
        text: 'text-gray-900',
        border: 'border-orange-200',
        label: 'Оранжевый',
    },
    yellow: {
        bg: 'bg-yellow-100',
        header: 'bg-yellow-200',
        text: 'text-gray-900',
        border: 'border-yellow-200',
        label: 'Жёлтый',
    },
    green: {
        bg: 'bg-green-100',
        header: 'bg-green-200',
        text: 'text-gray-900',
        border: 'border-green-200',
        label: 'Зелёный',
    },
    teal: {
        bg: 'bg-teal-100',
        header: 'bg-teal-200',
        text: 'text-gray-900',
        border: 'border-teal-200',
        label: 'Бирюзовый',
    },
    blue: {
        bg: 'bg-blue-100',
        header: 'bg-blue-200',
        text: 'text-gray-900',
        border: 'border-blue-200',
        label: 'Синий',
    },
    purple: {
        bg: 'bg-purple-100',
        header: 'bg-purple-200',
        text: 'text-gray-900',
        border: 'border-purple-200',
        label: 'Фиолетовый',
    },
    darkRed: {
        bg: 'bg-red-100',
        header: 'bg-red-500',
        text: 'text-white',
        border: 'border-red-200',
        label: 'Тёмно-красный',
    },
    darkOrange: {
        bg: 'bg-orange-100',
        header: 'bg-orange-500',
        text: 'text-white',
        border: 'border-orange-200',
        label: 'Тёмно-оранжевый',
    },
    darkYellow: {
        bg: 'bg-yellow-100',
        header: 'bg-yellow-500',
        text: 'text-white',
        border: 'border-yellow-200',
        label: 'Тёмно-жёлтый',
    },
    darkGreen: {
        bg: 'bg-green-100',
        header: 'bg-green-500',
        text: 'text-white',
        border: 'border-green-200',
        label: 'Тёмно-зелёный',
    },
    darkTeal: {
        bg: 'bg-teal-100',
        header: 'bg-teal-500',
        text: 'text-white',
        border: 'border-teal-200',
        label: 'Тёмно-бирюзовый',
    },
    darkBlue: {
        bg: 'bg-blue-100',
        header: 'bg-blue-500',
        text: 'text-white',
        border: 'border-blue-200',
        label: 'Тёмно-синий',
    },
    darkPurple: {
        bg: 'bg-purple-100',
        header: 'bg-purple-500',
        text: 'text-white',
        border: 'border-purple-200',
        label: 'Тёмно-фиолетовый',
    },
} as const;

export const allColors = [
    ...Object.entries(columnColors).map(([key, styles]) => ({
        value: key,
        styles,
        label: styles.label,
    })),
    { value: 'white', styles: baseColor.white, label: baseColor.white.label }
] as const;

export type AllColorKeys = typeof allColors[number]['value'];
export const allColorValues = allColors.map(c => c.value) as AllColorKeys[];

export const priorityColors = {
    low: 'bg-green-200 text-green-700',
    medium: 'bg-yellow-200 text-yellow-700',
    high: 'bg-orange-200 text-orange-700',
    urgent: 'bg-red-200 text-red-700',
} as const;
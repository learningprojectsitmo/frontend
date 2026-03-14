export const columnColors = {
    gray: {
        bg: 'bg-gray-100',
        header: 'bg-gray-200',
        text: 'text-gray-700',
        border: 'border-gray-300',
    },
    blue: {
        bg: 'bg-blue-50',
        header: 'bg-blue-100',
        text: 'text-blue-700',
        border: 'border-blue-200',
    },
    yellow: {
        bg: 'bg-yellow-50',
        header: 'bg-yellow-100',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
    },
    green: {
        bg: 'bg-green-50',
        header: 'bg-green-100',
        text: 'text-green-700',
        border: 'border-green-200',
    },
    purple: {
        bg: 'bg-purple-50',
        header: 'bg-purple-100',
        text: 'text-purple-700',
        border: 'border-purple-200',
    },
    red: {
        bg: 'bg-red-50',
        header: 'bg-red-100',
        text: 'text-red-700',
        border: 'border-red-200',
    },
} as const;

export const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-yellow-100 text-yellow-700',
    high: 'bg-orange-100 text-orange-700',
    urgent: 'bg-red-100 text-red-700',
} as const;

export const statusLabels = {
    not_started: 'Не начато',
    in_progress: 'В процессе',
    review: 'Ревью',
    done: 'Готово',
} as const;
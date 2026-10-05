import { MAX_VACANCY_TASK_LENGTH } from "@/types/api";
import type { EditableVacancy } from "./vacancy-sync";

/**
 * Ошибки полей формы редактирования проекта.
 *
 * Хранятся по индексу роли, а не по id: у новых роли id ещё нет, а после
 * удаления индексы сдвигаются — держать ошибку нужно ровно на том поле,
 * где её показали.
 */
export type RoleFieldErrors = {
    title?: string;
    tasks?: string;
};

export type ProjectFormErrors = {
    /** Название проекта. */
    title?: string;
    /** Ошибки ролей по индексу в форме. */
    roles: RoleFieldErrors[];
    /**
     * Ошибки, которые не принадлежат одному полю: превышение лимита
     * участников (это сумма по всем ролям) и ответ сервера.
     */
    form?: string;
};

/**
 * Проверить форму редактирования проекта.
 *
 * Возвращает пустой объект, если всё в порядке. Правила повторяют
 * `VacancyCreate` на бэкенде (пустые задачи, лимит длины, дубли), чтобы
 * пользователь увидел проблему под полем, а не после отправки.
 *
 * Серверные ответы сюда не попадают: они несут произвольный текст, который
 * не соотносится с конкретным полем.
 */
export const validateProjectForm = ({
    title,
    roles,
    maxParticipants,
}: {
    title: string;
    roles: readonly EditableVacancy[];
    maxParticipants?: number | null;
}): ProjectFormErrors => {
    const errors: ProjectFormErrors = { roles: [] };

    if (!title.trim()) {
        errors.title = "Введите название проекта";
    }

    for (const [index, role] of roles.entries()) {
        const roleErrors: RoleFieldErrors = {};

        if (!role.title.trim()) {
            roleErrors.title = "Введите название роли";
        }

        const filledTasks = role.tasks.filter((t) => t.trim() !== "");
        if (filledTasks.length === 0) {
            roleErrors.tasks = "Добавьте хотя бы одну задачу";
        } else if (filledTasks.some((t) => t.trim().length > MAX_VACANCY_TASK_LENGTH)) {
            roleErrors.tasks = `Задача не может быть длиннее ${MAX_VACANCY_TASK_LENGTH} символов`;
        } else {
            const trimmed = filledTasks.map((t) => t.trim());
            if (new Set(trimmed).size !== trimmed.length) {
                roleErrors.tasks = "Задачи внутри одной роли не должны повторяться";
            }
        }

        if (roleErrors.title || roleErrors.tasks) {
            errors.roles[index] = roleErrors;
        }
    }

    const totalRequired = roles.reduce((sum, r) => sum + r.count, 0);
    if (maxParticipants && totalRequired > maxParticipants) {
        errors.form = `Сумма необходимых участников (${totalRequired}) превышает максимальное количество (${maxParticipants})`;
    }

    return errors;
};

/** Ошибки формы скрыты, если ни одно поле не подсвечено. */
export const hasFormErrors = (errors: ProjectFormErrors): boolean =>
    Boolean(errors.title || errors.form || errors.roles.some((r) => r?.title || r?.tasks));

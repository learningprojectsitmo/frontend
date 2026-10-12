/** Роль в состоянии формы редактирования. */
export type EditableVacancy = {
    id: number | null;
    title: string;
    tasks: string[];
    count: number;
};

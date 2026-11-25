// @vitest-environment jsdom
import { AxiosError } from "axios";
import { toast } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { examApi, questionApi } from "@/lib/exams";
import { queryKeys } from "@/lib/query-keys";
import { getProject } from "@/lib/projects";
import type { Exam, ExamSlot, Registration } from "@/types/exam";
import type { BackendProjectType } from "@/types/api";
import { ExamAdminPanel } from "./exam-admin-panel";
import { ProjectTypeQuestionsEditor } from "./project-type-questions-editor";

vi.mock("@/lib/auth", () => ({
    useUser: () => ({ data: { permissions: ["workspace:update"] } }),
}));
vi.mock("@/lib/projects", () => ({
    getProject: vi.fn(),
    useProjectsList: () => ({
        data: {
            items: [
                {
                    id: 101,
                    name: "Первая команда",
                    author_id: 1,
                    project_type_id: 5,
                    participants_preview: [],
                },
                {
                    id: 102,
                    name: "Вторая команда",
                    author_id: 1,
                    project_type_id: 5,
                    participants_preview: [],
                },
            ],
        },
    }),
}));
vi.mock("@/components/ui/date-picker", () => ({ DatePicker: () => null }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), info: vi.fn(), success: vi.fn() } }));

const startsAt = new Date(2099, 0, 1, 10).toISOString();
const exam: Exam = {
    id: 2,
    workspace_id: 1,
    status: "draft",
    current_settings_version: 3,
    created_at: startsAt,
    created_by: 1,
    published_at: null,
    published_by: null,
    configuration: {
        title: "Тестовый экзамен",
        description: "Описание",
        starts_at: startsAt,
        project_type_ids: [5],
        weights: { teacher: 60, manager: 30, member: 10 },
        max_score: 25,
        presentation_minutes: 7,
        questions_minutes: 7,
        transition_minutes: 1,
        assessment_window_minutes: 3,
        connection_url: null,
        registration_opens_at: null,
        registration_closes_at: null,
    },
};
const slot: ExamSlot = {
    id: 3,
    workspace_id: 1,
    exam_id: 2,
    starts_at: startsAt,
    ends_at: new Date(2099, 0, 1, 10, 15).toISOString(),
    is_available: false,
};
const registration: Registration = {
    id: 4,
    version: 7,
    workspace_id: 1,
    exam_id: 2,
    slot_id: 3,
    project_id: 101,
    status: "active",
    project_type_id_at_registration: 5,
    queue_position: 1,
    queue_hold: null,
    created_source: "organizer",
    created_by: 1,
    updated_by: 1,
    created_at: startsAt,
    updated_at: startsAt,
    started_at: null,
};

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;

const onSaved = vi.fn();
const projectTypes = [
    { id: 5, name: "Продуктовый" },
    { id: 6, name: "Исследовательский" },
] as BackendProjectType[];

const criterion = (scale: 3 | 5) => ({
    id: 10,
    position: 0,
    text: "Вопрос",
    description: null,
    levels: ([1, 2, 3, 4, 5] as const)
        .slice(0, scale)
        .map((score) => ({ score, description: `Описание ${score}` })),
});

async function renderCriteria() {
    await act(async () => {
        root.render(
            <QueryClientProvider client={client}>
                <ProjectTypeQuestionsEditor workspaceId={1} typeId={5} typeName="Продуктовый" />
            </QueryClientProvider>,
        );
    });
}

async function render(value?: Exam, onWorkspaceChange?: (id: number) => void) {
    await act(async () => {
        root.render(
            <QueryClientProvider client={client}>
                <ExamAdminPanel
                    workspaceId={1}
                    workspaceName="Тест"
                    projectTypes={projectTypes}
                    exam={value}
                    workspaces={[
                        { id: 1, title: "Первое" },
                        { id: 2, title: "Второе" },
                    ]}
                    onWorkspaceChange={onWorkspaceChange}
                    onCancel={vi.fn()}
                    onSaved={onSaved}
                />
            </QueryClientProvider>,
        );
    });
}

async function click(label: string) {
    const button = [...document.querySelectorAll("button")].find(
        (item) => item.textContent?.trim() === label,
    );
    expect(button, label).toBeDefined();
    await act(async () => {
        button?.click();
    });
}

function fill(selector: string, value: string) {
    const input = container.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
    expect(input).toBeTruthy();
    act(() => {
        const setter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(input!), "value")?.set;
        setter?.call(input, value);
        input?.dispatchEvent(new Event("input", { bubbles: true }));
    });
}

beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    document.body.appendChild((container = document.createElement("div")));
    root = createRoot(container);
    client = new QueryClient({
        defaultOptions: { queries: { retry: false, staleTime: Infinity } },
    });
    localStorage.clear();
    vi.mocked(getProject).mockResolvedValue({
        id: 101,
        name: "Первая команда",
        author_id: 1,
        author_name: "Анна Смирнова",
        author_email: null,
        has_user_applied: false,
        theme: null,
        description: null,
        max_participants: null,
        status_id: null,
        deadline: null,
        progress: 0,
        tags: [],
        workspace_id: 1,
        created_at: startsAt,
        status: null,
        participants_count: 0,
        participants_preview: [],
        members: [],
        replycants: [],
        vacancies: [],
        archived_vacancies: [],
        project_type_id: null,
        current_stage_id: null,
        stage_pending_approval: false,
        stages: [],
        stage_rejection: null,
    });
    onSaved.mockReset();
    vi.spyOn(examApi, "get").mockResolvedValue(exam);
    vi.spyOn(examApi, "slots").mockResolvedValue({ items: [], has_more: false });
    vi.spyOn(examApi, "registrations").mockResolvedValue({
        items: [],
        limit: 100,
        offset: 0,
        has_more: false,
    });
    vi.spyOn(examApi, "settings").mockResolvedValue({
        items: [],
        limit: 100,
        offset: 0,
        has_more: false,
    });
});

afterEach(() => {
    act(() => root.unmount());
    client.clear();
    container.remove();
    vi.useRealTimers();
    vi.restoreAllMocks();
});

describe("exam form", () => {
    it("starts with empty fields on every visit, even with an old local draft", async () => {
        localStorage.setItem("eduflow:exam-draft:1:new", JSON.stringify(exam.configuration));
        await render();
        expect(container.querySelector<HTMLInputElement>("#exam-title")?.value).toBe("");
        expect(container.querySelector<HTMLTextAreaElement>("#exam-description")?.value).toBe("");
        expect(container.querySelector('button[aria-pressed="true"]')).toBeNull();

        fill("#exam-title", "Несохранённый экзамен");
        await act(async () => {
            root.render(null);
        });
        await render();
        expect(container.querySelector<HTMLInputElement>("#exam-title")?.value).toBe("");
    });

    it("shows required field errors only after submission", async () => {
        await render();
        expect(container.textContent).not.toContain("Укажите название");
        await click("Сохранить черновик");
        expect(container.textContent).toContain("Укажите название");
    });

    it.each(["", "   "])("creates an exam with an optional description (%j)", async (value) => {
        const saved = { ...exam, configuration: { ...exam.configuration, description: null } };
        const create = vi.spyOn(examApi, "create").mockResolvedValue(saved);
        await render();
        fill("#exam-title", exam.configuration.title);
        fill("#exam-description", value);
        await click("Продуктовый");
        expect(container.querySelector('label[for="exam-description"]')?.textContent).toBe(
            "Описание",
        );

        await click("Сохранить черновик");

        expect(create).toHaveBeenCalledWith(1, expect.objectContaining({ description: null }));
        expect(onSaved).toHaveBeenCalledWith(saved);
    });

    it("clears the description in the saved revision", async () => {
        const saved = {
            ...exam,
            current_settings_version: 4,
            configuration: { ...exam.configuration, description: null },
        };
        const replace = vi.spyOn(examApi, "replaceSettings").mockResolvedValue(saved);
        await render(exam);
        fill("#exam-description", "   ");
        fill('[aria-label="Причина изменения"]', "Очистили описание");

        await click("Сохранить");

        expect(replace).toHaveBeenCalledWith(1, 2, {
            expected_version: 3,
            reason: "Очистили описание",
            configuration: saved.configuration,
        });
    });

    it("generates the configured duration including the transition and sends the batch with the draft", async () => {
        vi.setSystemTime(new Date(Date.parse(startsAt) - 7 * 24 * 60 * 60 * 1000));
        const saved = { ...exam, configuration: { ...exam.configuration, transition_minutes: 6 } };
        const create = vi.spyOn(examApi, "create").mockResolvedValue(saved);
        const replaceSlots = vi.spyOn(examApi, "replaceSlots").mockResolvedValue([slot]);
        await render();
        fill("#exam-title", exam.configuration.title);
        fill("#exam-description", exam.configuration.description ?? "");
        await click("Продуктовый");
        await click("Оценивание");
        expect(container.querySelector("#exam-assessment-window")).toBeTruthy();
        expect(container.querySelector("#transition_minutes")).toBeNull();
        await click("Очередь выступлений");
        expect(container.querySelector("#exam-assessment-window")).toBeNull();
        expect(container.textContent).not.toContain("Интервал между участниками");
        await click("Сгенерировать слоты");
        expect(container.textContent).toContain("Окончание: 10:15");

        fill("#transition_minutes", "6");
        expect(container.textContent).toContain("новое время окончания — 10:20");
        await click("Отменить пересчёт");
        expect(container.textContent).toContain("Окончание: 10:15");

        fill("#transition_minutes", "6");
        await click("Применить");
        expect(container.textContent).toContain("Окончание: 10:20");
        expect(container.textContent).toContain("20 мин.");
        await act(async () => {
            container
                .querySelector<HTMLButtonElement>('[aria-label="Расширить таблицу очереди"]')
                ?.click();
        });
        await click("Добавить слот");
        expect(
            document.querySelector('[role="dialog"]')?.querySelectorAll("tbody tr"),
        ).toHaveLength(3);
        await click("Close");
        expect(container.textContent).toContain("Окончание: 10:40");
        await click("Сохранить черновик");
        expect(create).toHaveBeenCalledWith(1, saved.configuration);
        expect(replaceSlots).toHaveBeenCalledWith(1, 2, {
            expected_slots: [],
            slots: [
                {
                    starts_at: startsAt,
                    ends_at: new Date(Date.parse(startsAt) + 20 * 60_000).toISOString(),
                    kind: "defense",
                },
                {
                    starts_at: new Date(Date.parse(startsAt) + 20 * 60_000).toISOString(),
                    ends_at: new Date(Date.parse(startsAt) + 40 * 60_000).toISOString(),
                    kind: "defense",
                },
            ],
        });
        expect(onSaved).toHaveBeenCalledWith(saved);
    });

    it("changes project types without a blocking prompt", async () => {
        const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
        await render();
        await click("Продуктовый");
        await click("Продуктовый");
        expect(confirm).not.toHaveBeenCalled();
        expect(container.querySelector('button[aria-pressed="true"]')).toBeNull();
    });

    it("restores the workspace selection on Escape and switches only on confirmation", async () => {
        const change = vi.fn();
        await render(undefined, change);
        fill("#exam-title", exam.configuration.title);
        const select = container.querySelector("select")!;
        const choose = async () => {
            await act(async () => {
                select.value = "2";
                select.dispatchEvent(new Event("change", { bubbles: true }));
            });
        };
        await choose();
        const popover = document.querySelector('[aria-label="Подтверждение смены пространства"]');
        expect(popover?.parentElement?.contains(select)).toBe(true);
        expect(change).not.toHaveBeenCalled();
        await act(async () => {
            popover?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        });
        expect(select.value).toBe("1");
        expect(container.querySelector<HTMLInputElement>("#exam-title")?.value).toBe(
            exam.configuration.title,
        );
        await choose();
        await act(async () => {
            document.body.dispatchEvent(new MouseEvent("pointerdown", { bubbles: true }));
        });
        expect(select.value).toBe("1");
        expect(change).not.toHaveBeenCalled();

        await choose();
        await click("Продолжить");
        expect(change).toHaveBeenCalledWith(2, {
            title: exam.configuration.title,
            starts_at: expect.any(String),
        });
    });

    it("saves edits for a draft with a past start and no new slots", async () => {
        const pastExam = {
            ...exam,
            configuration: { ...exam.configuration, starts_at: "2020-01-01T10:00:00Z" },
        };
        const revised = {
            ...pastExam,
            current_settings_version: 4,
            configuration: { ...pastExam.configuration, title: "Прошедший экзамен" },
        };
        const replace = vi.spyOn(examApi, "replaceSettings").mockResolvedValue(revised);
        await render(pastExam);
        fill("#exam-title", revised.configuration.title);
        fill('[aria-label="Причина изменения"]', "Уточнили название");
        await click("Сохранить");

        expect(replace).toHaveBeenCalledWith(1, 2, {
            expected_version: 3,
            reason: "Уточнили название",
            configuration: revised.configuration,
        });
    });

    it("blocks a stale settings retry until the editor explicitly loads the new baseline", async () => {
        const latest = {
            ...exam,
            current_settings_version: 4,
            configuration: { ...exam.configuration, title: "Название из другого окна" },
        };
        const replace = vi
            .spyOn(examApi, "replaceSettings")
            .mockRejectedValueOnce({
                isAxiosError: true,
                response: { data: { detail: { code: "settings_version_conflict" } } },
            })
            .mockResolvedValueOnce(latest);
        vi.spyOn(examApi, "get").mockResolvedValue(latest);
        await render(exam);
        fill("#exam-description", "Описание из второго окна");
        fill('[aria-label="Причина изменения"]', "Описание");
        await click("Сохранить");
        await render(latest);
        await click("Сохранить");
        expect(replace).toHaveBeenCalledTimes(1);
        expect(replace.mock.calls[0][2].expected_version).toBe(3);
        expect(container.querySelector<HTMLTextAreaElement>("#exam-description")?.value).toBe(
            "Описание из второго окна",
        );

        await click("Загрузить актуальные настройки");
        expect(container.querySelector<HTMLInputElement>("#exam-title")?.value).toBe(
            "Название из другого окна",
        );
        fill("#exam-description", "Описание из второго окна");
        fill('[aria-label="Причина изменения"]', "Описание");
        await click("Сохранить");
        expect(replace.mock.calls[1][2]).toMatchObject({
            expected_version: 4,
            configuration: {
                title: "Название из другого окна",
                description: "Описание из второго окна",
            },
        });
    });

    it("does not save an unchanged exam", async () => {
        const replace = vi.spyOn(examApi, "replaceSettings");
        const replaceSlots = vi.spyOn(examApi, "replaceSlots");
        vi.mocked(toast.success).mockClear();
        await render(exam);

        await click("Сохранить");

        expect(toast.info).toHaveBeenCalledWith("Нет изменений для сохранения");
        expect(toast.success).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        expect(replaceSlots).not.toHaveBeenCalled();
        expect(onSaved).not.toHaveBeenCalled();
    });

    it.each([[3], [5], [3, 5]] as Array<Array<3 | 5>>)(
        "publishes a draft without a description using its project types’ scales (%j, %j)",
        async (...scales) => {
            const draft = {
                ...exam,
                configuration: {
                    ...exam.configuration,
                    description: null,
                    project_type_ids: scales.map((_, index) => 5 + index),
                },
            };
            const published = { ...draft, status: "published" as const };
            vi.spyOn(questionApi, "get").mockImplementation(async (_, id) => ({
                project_type_id: id,
                min_score: 1,
                max_score: scales[id - 5],
                questions: [criterion(scales[id - 5])],
            }));
            const publish = vi.spyOn(examApi, "publish").mockResolvedValue(published);

            await render(draft);
            await click("Опубликовать");
            await click("Опубликовать экзамен");

            expect(publish).toHaveBeenCalledWith(1, 2, 3);
            expect(onSaved).toHaveBeenCalledWith(published);
        },
    );

    it("reports the selected scale for an invalid criteria list", async () => {
        vi.spyOn(questionApi, "get").mockResolvedValue({
            project_type_id: 5,
            min_score: 1,
            max_score: 3,
            questions: [],
        });
        const publish = vi.spyOn(examApi, "publish");
        await render(exam);

        await click("Опубликовать");
        await click("Опубликовать экзамен");

        expect(container.textContent).toContain("Нельзя опубликовать экзамен");
        const error = [...container.querySelectorAll("li")].find((item) =>
            item.textContent?.includes("Проверьте вопросы типа"),
        );
        expect(error?.textContent).toContain("1–3");
        expect(error?.textContent).not.toContain("1–5");
        expect(publish).not.toHaveBeenCalled();
    });

    it("publishes the saved revision and clears its reason", async () => {
        const revised = {
            ...exam,
            current_settings_version: 4,
            configuration: {
                ...exam.configuration,
                title: "Новое название",
            },
        };
        const replace = vi.spyOn(examApi, "replaceSettings").mockResolvedValue(revised);
        const published = { ...revised, status: "published" as const };
        const publish = vi.spyOn(examApi, "publish").mockResolvedValue(published);
        vi.spyOn(questionApi, "get").mockResolvedValue({
            project_type_id: 5,
            min_score: 1,
            max_score: 5,
            questions: [
                {
                    id: 6,
                    position: 1,
                    text: "Вопрос",
                    description: null,
                    levels: ([1, 2, 3, 4, 5] as const).map((score) => ({
                        score,
                        description: "Критерий",
                    })),
                },
            ],
        });
        await render(exam);
        fill("#exam-title", "Новое название");
        fill('[aria-label="Причина изменения"]', "Уточнили название");
        await click("Опубликовать");
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
            "Вы точно хотите опубликовать экзамен?",
        );
        expect(publish).not.toHaveBeenCalled();
        expect(replace).not.toHaveBeenCalled();
        await click("Вернуться к черновику");
        expect(document.querySelector('[role="dialog"]')).toBeNull();
        expect(publish).not.toHaveBeenCalled();

        await click("Опубликовать");
        await click("Опубликовать экзамен");
        expect(replace).toHaveBeenCalledWith(1, 2, {
            expected_version: 3,
            reason: "Уточнили название",
            configuration: revised.configuration,
        });
        expect(publish).toHaveBeenCalledWith(1, 2, 4);
        expect(
            container.querySelector<HTMLInputElement>('[aria-label="Причина изменения"]')?.value,
        ).toBe("");
        expect(examApi.settings).toHaveBeenCalledTimes(2);
        expect(onSaved).toHaveBeenCalledWith(published);
    });

    it("removes a team using the registration version and ignores cancelled history", async () => {
        const published = { ...exam, status: "published" as const };
        client.setQueryData(queryKeys.exams.slots(1, 2), { items: [slot], has_more: false });
        client.setQueryData(queryKeys.exams.registrations(1, 2), {
            items: [registration, { ...registration, id: 9, status: "cancelled" }],
        });
        const cancel = vi
            .spyOn(examApi, "cancelRegistration")
            .mockResolvedValue({ ...registration, status: "cancelled" });
        vi.mocked(examApi.slots).mockResolvedValue({ items: [slot], has_more: false });
        vi.mocked(examApi.registrations).mockResolvedValue({
            items: [{ ...registration, status: "cancelled" }],
            limit: 100,
            offset: 0,
            has_more: false,
        });
        await render(published);
        await click("Очередь выступлений");
        await act(async () => {
            await Promise.resolve();
        });
        expect(container.textContent).toContain("Анна Смирнова");
        expect(container.textContent).toContain("Первая команда");
        await act(async () => {
            container
                .querySelector<HTMLButtonElement>('[aria-label="Расширить таблицу очереди"]')
                ?.click();
        });
        const dialog = document.querySelector('[role="dialog"]');
        expect(dialog?.querySelector("table")).toBeTruthy();
        expect(container.querySelector("table")).toBeNull();
        await click("Убрать");
        expect(cancel).toHaveBeenCalledWith(1, 2, 4, 7, "Команда снята со слота");
        expect(dialog?.textContent).not.toContain("Первая команда");
        await click("Close");
        expect(container.querySelector("table")).toBeTruthy();
        expect(container.textContent).not.toContain("Первая команда");
        expect(container.textContent).toContain("Назначить");
    });
    it("keeps the original assignment when the atomic replacement fails", async () => {
        const published = { ...exam, status: "published" as const };
        client.setQueryData(queryKeys.exams.slots(1, 2), { items: [slot], has_more: false });
        client.setQueryData(queryKeys.exams.registrations(1, 2), { items: [registration] });
        const error = new AxiosError("Request failed");
        Object.assign(error, {
            response: { data: { detail: { code: "project_type_not_allowed" } } },
        });
        vi.spyOn(console, "error").mockImplementation(() => {});
        const cancel = vi.spyOn(examApi, "cancelRegistration");
        const register = vi.spyOn(examApi, "register");
        const replace = vi.spyOn(examApi, "replaceRegistration").mockRejectedValue(error);
        vi.mocked(examApi.slots).mockResolvedValue({ items: [slot], has_more: false });
        vi.mocked(examApi.registrations).mockResolvedValue({
            items: [registration],
            limit: 100,
            offset: 0,
            has_more: false,
        });

        await render(published);
        await click("Очередь выступлений");
        await click("Заменить");
        const picker = document.querySelector('[aria-label="Выбор команды"]');
        expect(picker).toBeTruthy();
        expect(container.contains(picker)).toBe(false);
        await act(async () => {
            picker?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
        });
        expect(document.querySelector('[aria-label="Выбор команды"]')).toBeNull();
        await click("Заменить");
        await click("Вторая команда");

        expect(replace).toHaveBeenCalledWith(1, 2, registration, 102, {
            starts_at: slot.starts_at,
            ends_at: slot.ends_at,
        });
        expect(cancel).not.toHaveBeenCalled();
        expect(register).not.toHaveBeenCalled();
        expect(document.querySelector('[aria-label="Выбор команды"]')).toBeNull();
        expect(container.textContent).toContain("Первая команда");
    });

    it("asks before removing levels and saves the selected scale with retained IDs", async () => {
        const question = criterion(5);
        const data = {
            project_type_id: 5,
            min_score: 1 as const,
            max_score: 5 as const,
            questions: [question],
            etag: "first-etag",
        };
        const narrowed = { ...data, max_score: 3 as const, questions: [criterion(3)] };
        client.setQueryData(queryKeys.projectTypeQuestions.detail(1, 5), data);
        client.setQueryData(queryKeys.projectTypeQuestions.templates(), []);
        const save = vi.spyOn(questionApi, "replace").mockResolvedValue(narrowed);
        await renderCriteria();

        const select = container.querySelector<HTMLSelectElement>(
            'select[aria-label="Шкала оценивания"]',
        );
        expect(select?.value).toBe("5");
        const choose = async () => {
            await act(async () => {
                select!.value = "3";
                select!.dispatchEvent(new Event("change", { bubbles: true }));
            });
        };
        await choose();
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain("Уровни 4 и 5");
        expect(container.textContent).toContain("Уровень 5");
        expect(save).not.toHaveBeenCalled();
        await click("Отмена");
        expect(select?.value).toBe("5");

        await choose();
        await click("Изменить шкалу");
        expect(select?.value).toBe("3");
        expect(container.textContent).not.toContain("Уровень 4");
        expect(save).not.toHaveBeenCalled();

        await click("Сохранить вопросы");
        expect(save).toHaveBeenCalledWith(1, 5, [criterion(3)], 3, data.etag);
        await click("Добавить критерий");
        expect(
            [...container.querySelectorAll("label")].filter((label) =>
                label.textContent?.startsWith("Уровень "),
            ),
        ).toHaveLength(6);
    });

    it("keeps the question snapshot from edit start until a conflict is explicitly reloaded", async () => {
        const initial = {
            project_type_id: 5,
            min_score: 1 as const,
            max_score: 5 as const,
            questions: [criterion(5)],
            etag: "initial-etag",
        };
        const latest = {
            ...initial,
            etag: "latest-etag",
            questions: [{ ...criterion(5), text: "Критерий из другого окна" }],
        };
        const key = queryKeys.projectTypeQuestions.detail(1, 5);
        client.setQueryData(key, initial);
        client.setQueryData(queryKeys.projectTypeQuestions.templates(), []);
        const save = vi.spyOn(questionApi, "replace").mockRejectedValue({
            isAxiosError: true,
            response: { data: { detail: { code: "questions_conflict" } } },
        });
        vi.spyOn(questionApi, "get").mockResolvedValue(latest);
        await renderCriteria();
        fill('input[placeholder="Название критерия"]', "Локальный критерий");
        await act(async () => {
            client.setQueryData(key, latest);
        });

        await click("Сохранить вопросы");
        expect(save).toHaveBeenCalledWith(1, 5, expect.any(Array), 5, "initial-etag");
        await click("Сохранить вопросы");
        expect(save).toHaveBeenCalledTimes(1);
        await click("Загрузить актуальные критерии");
        expect(
            container.querySelector<HTMLInputElement>('input[placeholder="Название критерия"]')
                ?.value,
        ).toBe("Критерий из другого окна");
    });

    it("shows templates for the selected scale and confirms replacing existing criteria", async () => {
        const data = {
            project_type_id: 5,
            min_score: 1 as const,
            max_score: 3 as const,
            questions: [criterion(3)],
            etag: "first-etag",
        };
        client.setQueryData(queryKeys.projectTypeQuestions.detail(1, 5), data);
        client.setQueryData(queryKeys.projectTypeQuestions.templates(), [
            { code: "product", name: "Продуктовый", max_score: 5, questions: [] },
            { code: "project_defense", name: "Защита проекта", max_score: 3, questions: [] },
        ]);
        const apply = vi.spyOn(questionApi, "applyTemplate").mockResolvedValue(data);
        await renderCriteria();

        const options = [...container.querySelectorAll<HTMLSelectElement>("select")][1]?.options;
        expect([...options].map((option) => option.textContent)).toEqual(["Защита проекта · 1–3"]);

        await click("Заменить вопросы шаблоном");
        expect(document.querySelector('[role="dialog"]')?.textContent).toContain(
            "заменит все критерии",
        );
        expect(apply).not.toHaveBeenCalled();
        await click("Отмена");
        await click("Заменить вопросы шаблоном");
        await click("Применить шаблон");

        expect(apply).toHaveBeenCalledWith(1, 5, "project_defense", data.etag);
    });

    it.each([3, 5] as const)("preserves question IDs on scale %i", async (scale) => {
        const question = {
            id: 0,
            position: 1,
            text: "Вопрос",
            description: null,
            levels: ([1, 2, 3, 4, 5] as const)
                .slice(0, scale)
                .map((score) => ({ score, description: "Критерий" })),
        };
        const data = {
            project_type_id: 5,
            min_score: 1 as const,
            max_score: scale,
            questions: [question],
            etag: "first-etag",
        };
        client.setQueryData(queryKeys.projectTypeQuestions.detail(1, 5), data);
        client.setQueryData(queryKeys.projectTypeQuestions.templates(), []);
        const savedQuestion = { ...question, id: 10 };
        const invalid = new AxiosError("Request failed");
        Object.assign(invalid, {
            response: {
                data: {
                    detail: [
                        {
                            type: "string_too_short",
                            loc: ["body", "questions", 0, "description"],
                            msg: "String should have at least 1 character",
                        },
                    ],
                },
            },
        });
        const save = vi
            .spyOn(questionApi, "replace")
            .mockRejectedValueOnce(invalid)
            .mockResolvedValue({ ...data, questions: [savedQuestion], etag: "saved-etag" });
        await act(async () => {
            root.render(
                <QueryClientProvider client={client}>
                    <ProjectTypeQuestionsEditor workspaceId={1} typeId={5} typeName="Продуктовый" />
                </QueryClientProvider>,
            );
        });

        await click("Сохранить вопросы");
        expect(container.querySelector('[role="alert"]')?.textContent).toBe(
            "Введите описание или оставьте это поле пустым.",
        );
        expect(container.textContent).not.toContain("string_too_short");
        await click("Сохранить вопросы");
        expect(container.querySelector('[role="alert"]')).toBeNull();
        await click("Сохранить вопросы");

        expect(save).toHaveBeenNthCalledWith(2, 1, 5, [question], scale, data.etag);
        expect(save).toHaveBeenNthCalledWith(3, 1, 5, [savedQuestion], scale, "saved-etag");

        const lock = new AxiosError("Request failed");
        Object.assign(lock, { response: { data: { detail: { code: "questions_locked" } } } });
        save.mockRejectedValueOnce(lock);
        fill('input[placeholder="Название критерия"]', "Несохранённая правка");
        await click("Сохранить вопросы");

        expect(container.textContent).toContain("Критерии закреплены");
        expect(container.textContent).toContain("На одном из экзаменов уже открыли оценивание");
        expect(
            container.querySelector<HTMLInputElement>('input[placeholder="Название критерия"]')
                ?.value,
        ).toBe("Вопрос");
        expect(
            container.querySelector('input[placeholder="Название критерия"]')?.matches(":disabled"),
        ).toBe(true);
        expect(container.textContent).not.toContain("Сохранить вопросы");
        expect(client.getQueryData(queryKeys.projectTypeQuestions.lock(1, 5))).toBe(true);
    });
});

// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import i18n from "@/i18n/config";

import { LanguageSwitcher } from "./language-switcher";

// Компонентный тест на DOM-поведение без @testing-library — как в
// tableMembers.test.tsx. Регрессия: язык в i18next менялся, а текст на странице
// оставался прежним, и переключатель выглядел сломанным. Поэтому проверяем не
// `i18n.language`, а реальную перерисовку — компонент должен читать перевод
// через `useTranslation`, как это делают все секции лендинга.
declare global {
    var IS_REACT_ACT_ENVIRONMENT: boolean;
}

let container: HTMLDivElement;
let root: Root;

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const Probe = () => {
    const { t } = useTranslation();
    return <span data-testid="badge">{t("landing.hero.badge")}</span>;
};

const button = (label: string): HTMLButtonElement => {
    const found = [...container.querySelectorAll("button")].find((b) => b.textContent === label);
    if (!found) throw new Error(`кнопка ${label} не найдена`);
    return found;
};

const badge = (): string => container.querySelector("[data-testid=badge]")?.textContent ?? "";

const click = async (label: string) => {
    await act(async () => {
        button(label).dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
};

beforeEach(async () => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        await i18n.changeLanguage("ru");
    });
    act(() => {
        root.render(
            <QueryClientProvider client={queryClient}>
                <LanguageSwitcher />
                <Probe />
            </QueryClientProvider>,
        );
    });
});

afterEach(async () => {
    act(() => root.unmount());
    container.remove();
    await act(async () => {
        await i18n.changeLanguage("ru");
    });
});

describe("LanguageSwitcher: переключение языка", () => {
    it("перерисовывает текст на выбранный язык", async () => {
        // given
        const russian = badge();
        // when
        await click("EN");
        // then
        expect(i18n.language).toBe("en");
        expect(badge()).not.toBe(russian);
    });

    it("переключает обратно на русский", async () => {
        // given
        await click("EN");
        const english = badge();
        // when
        await click("RU");
        // then
        expect(i18n.language).toBe("ru");
        expect(badge()).not.toBe(english);
    });

    it("отмечает активный язык в aria-pressed", async () => {
        // given
        // when
        await click("EN");
        // then
        expect(button("EN").getAttribute("aria-pressed")).toBe("true");
        expect(button("RU").getAttribute("aria-pressed")).toBe("false");
    });

    it("переключает язык даже когда сохранение на сервере не вызвано (гость)", async () => {
        // given: `useUser` без авторизации — user === undefined, запроса нет
        // when
        await click("EN");
        // then: интерфейс переключился, ошибок нет
        expect(i18n.language).toBe("en");
        expect(button("EN").hasAttribute("disabled")).toBe(false);
    });

    it("реагирует на смену языка извне (регрессия)", async () => {
        // given: язык переключает не сам переключатель, а `LanguageSync`
        // после загрузки профиля — как при первом входе на новую страницу
        await act(async () => {
            await i18n.changeLanguage("en");
        });
        // when: переключатель не нажимали
        // then: активная кнопка всё равно переехала на EN
        // Раньше активное состояние читалось из обёртки `useTranslation()`, у
        // которой поле `language` — снимок на момент рендера, поэтому кнопка
        // оставалась на RU до полной перезагрузки страницы.
        expect(button("EN").getAttribute("aria-pressed")).toBe("true");
        expect(button("RU").getAttribute("aria-pressed")).toBe("false");
    });
});

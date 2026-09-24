import { env } from "@/config/env";

declare global {
    interface Window {
        ym?: YandexMetrika;
    }
}

type YandexMetrika = (id: number, action: string, params?: YandexMetrikaInitParams) => void;

type YandexMetrikaInitParams = {
    defer?: boolean;
    clickmap?: boolean;
    trackLinks?: boolean;
    accurateTrackBounce?: boolean;
    webvisor?: boolean;
};

type MetrikaQueue = ((...args: unknown[]) => void) & { a?: unknown[][] };

const METRIKA_SCRIPT_SRC = "https://mc.yandex.ru/metrika/tag.js";

const METRIKA_INIT_PARAMS: YandexMetrikaInitParams = {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
};

export function setupYandexMetrika(): void {
    const rawId = env.YANDEX_METRIKA_ID;
    if (!rawId) return;

    const counterId = Number(rawId);
    if (!Number.isInteger(counterId) || counterId <= 0) return;

    const existing = window.ym;
    if (existing) {
        const queue = existing as MetrikaQueue;
        queue.a = queue.a ?? [];
        queue.a.push([counterId, "init", METRIKA_INIT_PARAMS]);
        return;
    }

    const queue: MetrikaQueue = () => {};
    queue.a = [[counterId, "init", METRIKA_INIT_PARAMS]];
    window.ym = queue;

    const script = document.createElement("script");
    script.async = true;
    script.src = METRIKA_SCRIPT_SRC;
    document.head.appendChild(script);
}

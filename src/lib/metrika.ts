import { env } from "@/config/env";

declare global {
    interface Window {
        ym?: YandexMetrika;
    }
}

type YandexMetrikaInitParams = {
    defer?: boolean;
    clickmap?: boolean;
    trackLinks?: boolean;
    accurateTrackBounce?: boolean;
    webvisor?: boolean;
};

type YandexMetrikaParams = YandexMetrikaInitParams | string;
type YandexMetrika = (id: number, action: string, params: YandexMetrikaParams) => void;
type MetrikaQueue = YandexMetrika & { a: unknown[][] };

const METRIKA_SCRIPT_SRC = "https://mc.yandex.ru/metrika/tag.js";

const METRIKA_INIT_PARAMS: YandexMetrikaInitParams = {
    defer: true,
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
    webvisor: true,
};

let activeCounterId: number | null = null;
let lastTrackedPageUrl: string | undefined;

const getCounterId = (): number | null => {
    const rawId = env.YANDEX_METRIKA_ID;
    if (!rawId) return null;

    const counterId = Number(rawId);
    return Number.isInteger(counterId) && counterId > 0 ? counterId : null;
};

export function setupYandexMetrika(): void {
    const counterId = getCounterId();
    if (!counterId || activeCounterId === counterId) return;

    activeCounterId = counterId;

    if (window.ym) {
        window.ym(counterId, "init", METRIKA_INIT_PARAMS);
        return;
    }

    const queue = ((...args: Parameters<YandexMetrika>) => {
        queue.a.push(args);
    }) as MetrikaQueue;
    queue.a = [];
    window.ym = queue;
    queue(counterId, "init", METRIKA_INIT_PARAMS);

    const script = document.createElement("script");
    script.async = true;
    script.src = METRIKA_SCRIPT_SRC;
    document.head.appendChild(script);
}

export function disableYandexMetrika(): void {
    activeCounterId = null;
    lastTrackedPageUrl = undefined;
}

export function trackYandexMetrikaPageView(url: string): void {
    if (activeCounterId === null) return;

    const pageUrl = new URL(url, window.location.origin).toString();
    if (pageUrl === lastTrackedPageUrl) return;

    lastTrackedPageUrl = pageUrl;
    window.ym?.(activeCounterId, "hit", pageUrl);
}

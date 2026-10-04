import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Регрессия: страница откликов уходила в бесконечный цикл
 * `401 → /auth/refresh 200 → 401 → /auth/refresh 200 → …`.
 *
 * Причина backend-сторонняя и коварная: refresh-cookie ротируется на каждом
 * вызове, а повторное предъявление старого токена отзывает ВСЁ семейство
 * сессии (`auth_service.refresh_access_token` → reuse detection). То есть
 * лишний refresh — это не «просто лишний запрос», а способ убить сессию.
 *
 * Отсюда три инварианта, которые проверяются ниже:
 *   1. Параллельные 401 поднимают ОДИН refresh, а не по одному на запрос.
 *   2. Повторно не бьём `/auth/refresh`, если он только что прошёл.
 *   3. На эндпоинтах аутентификации 401 — часть контракта, refresh не нужен.
 */

interface FakeInstance {
    (config: unknown): Promise<unknown>;
    defaults: Record<string, unknown>;
    interceptors: {
        request: { use: (fn: unknown) => void };
        response: { use: (ok: unknown, err: unknown) => void };
    };
    get: ReturnType<typeof vi.fn>;
    post: ReturnType<typeof vi.fn>;
    /** Зарегистрированные перехватчики — достаём их для ручного вызова. */
    __request?: (config: unknown) => unknown;
    __onFulfilled?: (response: unknown) => unknown;
    __onRejected?: (error: unknown) => unknown;
}

const created: FakeInstance[] = [];

vi.mock("axios", () => {
    const create = () => {
        const inst = ((config: unknown) => Promise.resolve(config)) as unknown as FakeInstance;
        inst.defaults = {};
        inst.get = vi.fn();
        inst.post = vi.fn();
        inst.interceptors = {
            request: {
                use: (fn: unknown) => {
                    inst.__request = fn as FakeInstance["__request"];
                },
            },
            response: {
                use: (ok: unknown, err: unknown) => {
                    inst.__onFulfilled = ok as FakeInstance["__onFulfilled"];
                    inst.__onRejected = err as FakeInstance["__onRejected"];
                },
            },
        };
        created.push(inst);
        return inst;
    };
    return { default: { create } };
});

/** Конфиг запроса в том виде, в котором его кладёт axios. */
const makeRequest = (url: string, token: string | null = null) => ({
    url,
    headers: {} as Record<string, string>,
    _authToken: token,
    _retry: false,
});

const make401 = (config: unknown) => ({ response: { status: 401 }, config });

/** Прогоняет конфиг через request-interceptor — он ставит `_authToken`. */
const sendRequest = async (main: FakeInstance, url: string) => {
    const config = makeRequest(url);
    return await (main.__request as (c: unknown) => unknown)(config);
};

async function loadApi() {
    vi.resetModules();
    created.length = 0;
    const mod = await import("@/lib/api-client");
    return {
        main: created[0],
        refresh: created[1],
        setAccessToken: mod.setAccessToken,
        clearAccessToken: mod.clearAccessToken,
        getAccessToken: mod.getAccessToken,
        clearSessionExpired: mod.clearSessionExpired,
        isSessionExpired: mod.isSessionExpired,
    };
}

describe("api-client: обработка 401", () => {
    beforeEach(() => {
        vi.useRealTimers();
    });

    it("на параллельных 401 поднимает ровно один refresh", async () => {
        const { main, refresh, setAccessToken } = await loadApi();
        setAccessToken("old");

        let releaseRefresh: (value: unknown) => void = () => {};
        refresh.post.mockReturnValue(
            new Promise((resolve) => {
                releaseRefresh = resolve;
            }),
        );

        const reqA = makeRequest("/responses", "old");
        const reqB = makeRequest("/invitations", "old");
        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;

        const first = onRejected(make401(reqA));
        const second = onRejected(make401(reqB));

        // Оба 401 пришли до того, как refresh ответил, — но поднять он должен
        // был только один: второй обязан присоединиться к висящему промису.
        releaseRefresh({ access_token: "new" });
        await Promise.all([first, second]);

        expect(refresh.post).toHaveBeenCalledTimes(1);
        expect(reqA.headers.Authorization).toBe("Bearer new");
        expect(reqB.headers.Authorization).toBe("Bearer new");
    });

    it("не поднимает новый refresh, если только что обновлял токен", async () => {
        const { main, refresh, setAccessToken } = await loadApi();
        setAccessToken("old");
        refresh.post.mockResolvedValue({ access_token: "new" });

        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;

        // Первый 401 уходит в refresh и получает новый токен.
        await onRejected(make401(makeRequest("/responses", "old")));
        expect(refresh.post).toHaveBeenCalledTimes(1);

        // Второй 401 приходит уже с актуальным токеном и в пределах cooldown.
        // Если запрос ушёл со старым токеном — его просто переигрывают.
        const stale = makeRequest("/responses", "old");
        await onRejected(make401(stale));
        expect(refresh.post).toHaveBeenCalledTimes(1);
        expect(stale.headers.Authorization).toBe("Bearer new");

        // А вот запрос, ушедший с актуальным токеном, — это настоящий 401.
        const fresh = makeRequest("/responses", "new");
        await expect(onRejected(make401(fresh))).rejects.toBeDefined();
        expect(refresh.post).toHaveBeenCalledTimes(1);
    });

    it("не вызывает refresh на эндпоинтах аутентификации", async () => {
        const { main, refresh, setAccessToken } = await loadApi();
        setAccessToken("old");
        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;

        for (const url of ["/auth/login", "/auth/refresh", "/auth/logout", "/signup/request"]) {
            await expect(onRejected(make401(makeRequest(url, "old")))).rejects.toBeDefined();
        }

        expect(refresh.post).not.toHaveBeenCalled();
    });

    it("обновляет токен при 401 на /auth/me — это единственный путь восстановления сессии", async () => {
        const { main, refresh, getAccessToken } = await loadApi();
        refresh.post.mockResolvedValue({ access_token: "fresh" });

        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;
        await onRejected(make401(makeRequest("/auth/me", null)));

        expect(refresh.post).toHaveBeenCalledTimes(1);
        expect(getAccessToken()).toBe("fresh");
    });

    it("не зацикливается: второй 401 на переигранном запросе отклоняется", async () => {
        const { main, refresh, setAccessToken, isSessionExpired } = await loadApi();
        setAccessToken("old");
        refresh.post.mockResolvedValue({ access_token: "new" });

        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;
        const req = makeRequest("/responses", "old");

        // Первый 401 → refresh → переигровка запроса.
        await onRejected(make401(req));
        expect(refresh.post).toHaveBeenCalledTimes(1);

        // Переигрованный запрос снова 401. `_retry` уже выставлен, поэтому
        // вместо нового цикла — отказ и отметка «сессия истекла».
        await expect(onRejected(make401(req))).rejects.toBeDefined();
        expect(refresh.post).toHaveBeenCalledTimes(1);
        expect(isSessionExpired()).toBe(true);
    });

    it("чистит токен, когда refresh не удался", async () => {
        const { main, refresh, setAccessToken, getAccessToken, isSessionExpired } = await loadApi();
        setAccessToken("old");
        refresh.post.mockRejectedValue(new Error("Refresh token missing"));

        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;
        await expect(onRejected(make401(makeRequest("/responses", "old")))).rejects.toBeDefined();

        expect(getAccessToken()).toBeNull();
        expect(isSessionExpired()).toBe(true);
    });

    it("не считает истёкшей сессию, которой изначально не было", async () => {
        const { main, refresh, isSessionExpired } = await loadApi();
        refresh.post.mockRejectedValue(new Error("Refresh token missing"));

        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;
        await expect(onRejected(make401(makeRequest("/responses", null)))).rejects.toBeDefined();

        // Чистый визит без логина: показывать «сессия истекла» незачем.
        expect(isSessionExpired()).toBe(false);
    });

    it("проставляет Authorization из актуального токена", async () => {
        const { main, setAccessToken } = await loadApi();
        setAccessToken("token-42");

        const config = await sendRequest(main, "/responses");
        expect(config).toMatchObject({
            headers: { Authorization: "Bearer token-42", Accept: "application/json" },
            withCredentials: true,
            _authToken: "token-42",
        });
    });

    it("не ставит Authorization, если токена ещё нет", async () => {
        const { main } = await loadApi();

        const config = (await sendRequest(main, "/responses")) as {
            headers: Record<string, string>;
        };
        expect(config.headers.Authorization).toBeUndefined();
    });

    it("пропускает не-401 без попыток обновления", async () => {
        const { main, refresh } = await loadApi();

        const onRejected = main.__onRejected as (e: unknown) => Promise<unknown>;
        await expect(
            onRejected({ response: { status: 500 }, config: makeRequest("/responses", "old") }),
        ).rejects.toBeDefined();

        expect(refresh.post).not.toHaveBeenCalled();
    });
});

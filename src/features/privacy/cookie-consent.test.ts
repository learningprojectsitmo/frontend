import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
    setupSentry: vi.fn(),
    disableSentry: vi.fn(),
    setupYandexMetrika: vi.fn(),
    disableYandexMetrika: vi.fn(),
    trackYandexMetrikaPageView: vi.fn(),
}));

vi.mock("@/lib/sentry", () => ({
    setupSentry: mocks.setupSentry,
    disableSentry: mocks.disableSentry,
}));

vi.mock("@/lib/metrika", () => ({
    setupYandexMetrika: mocks.setupYandexMetrika,
    disableYandexMetrika: mocks.disableYandexMetrika,
    trackYandexMetrikaPageView: mocks.trackYandexMetrikaPageView,
}));

import {
    COOKIE_CONSENT_STORAGE_KEY,
    clearFunctionalStorage,
    disableDisallowedTelemetryServices,
    getCookieConsent,
    hasRevokedOptionalServices,
    initializeCookieConsentServices,
    storeCookieConsent,
    type CookieConsent,
    type CookiePreferences,
} from "@/features/privacy/cookie-consent";

const storage = new Map<string, string>();
const localStorageMock = {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
    clear: () => storage.clear(),
};

const createConsent = (preferences: Partial<CookiePreferences> = {}): CookieConsent => ({
    version: 1,
    necessary: true,
    functional: false,
    analytics: false,
    diagnostics: false,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...preferences,
});

beforeEach(() => {
    storage.clear();
    vi.clearAllMocks();
    Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: {
            localStorage: localStorageMock,
            location: {
                pathname: "/",
                search: "",
                hash: "",
            },
        },
    });
});

describe("cookie consent", () => {
    it("returns null for missing or invalid consent data", () => {
        expect(getCookieConsent()).toBeNull();

        storage.set(COOKIE_CONSENT_STORAGE_KEY, "not-json");
        expect(getCookieConsent()).toBeNull();
    });

    it("stores and reads a validated consent object", () => {
        const consent = createConsent({ functional: true, analytics: true });

        expect(storeCookieConsent(consent)).toBe(true);
        expect(getCookieConsent()).toEqual(consent);
    });

    it("clears optional functional storage when disabled", () => {
        storage.set("app-theme", "dark");
        storage.set("recently_viewed_project_ids", "[1]");

        clearFunctionalStorage();

        expect(storage.has("app-theme")).toBe(false);
        expect(storage.has("recently_viewed_project_ids")).toBe(false);
    });

    it("does not initialize optional services without consent", () => {
        initializeCookieConsentServices(null);

        expect(mocks.setupSentry).not.toHaveBeenCalled();
        expect(mocks.setupYandexMetrika).not.toHaveBeenCalled();
        expect(mocks.trackYandexMetrikaPageView).not.toHaveBeenCalled();
    });

    it("initializes only the services allowed by consent", () => {
        initializeCookieConsentServices(createConsent({ analytics: true }));

        expect(mocks.setupSentry).not.toHaveBeenCalled();
        expect(mocks.setupYandexMetrika).toHaveBeenCalledOnce();
        expect(mocks.trackYandexMetrikaPageView).toHaveBeenCalledWith("/");
    });

    it("disables services that are not allowed by consent", () => {
        disableDisallowedTelemetryServices(createConsent());

        expect(mocks.disableYandexMetrika).toHaveBeenCalledOnce();
        expect(mocks.disableSentry).toHaveBeenCalledOnce();
    });

    it("detects revocation of optional services", () => {
        const previous = createConsent({ analytics: true, diagnostics: true });

        expect(hasRevokedOptionalServices(previous, createConsent())).toBe(true);
        expect(
            hasRevokedOptionalServices(
                previous,
                createConsent({ functional: true, analytics: true, diagnostics: true }),
            ),
        ).toBe(false);
    });
});

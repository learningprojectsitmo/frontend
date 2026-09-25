import { z } from "zod";

import { disableSentry, setupSentry } from "@/lib/sentry";
import {
    disableYandexMetrika,
    setupYandexMetrika,
    trackYandexMetrikaPageView,
} from "@/lib/metrika";

export const COOKIE_CONSENT_STORAGE_KEY = "eduflow_cookie_consent";
export const COOKIE_CONSENT_VERSION = 1 as const;

const cookieConsentSchema = z.object({
    version: z.literal(COOKIE_CONSENT_VERSION),
    necessary: z.literal(true),
    functional: z.boolean(),
    analytics: z.boolean(),
    diagnostics: z.boolean(),
    updatedAt: z.string().min(1),
});

export type CookieConsent = z.infer<typeof cookieConsentSchema>;
export type CookiePreferences = Pick<CookieConsent, "functional" | "analytics" | "diagnostics">;

export const getDefaultCookiePreferences = (): CookiePreferences => ({
    functional: false,
    analytics: false,
    diagnostics: false,
});

export const getCookieConsent = (): CookieConsent | null => {
    if (typeof window === "undefined") return null;

    try {
        const raw = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
        if (!raw) return null;
        return cookieConsentSchema.parse(JSON.parse(raw));
    } catch {
        return null;
    }
};

export const storeCookieConsent = (consent: CookieConsent): boolean => {
    if (typeof window === "undefined") return false;

    try {
        window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
        return true;
    } catch {
        return false;
    }
};

export const clearFunctionalStorage = () => {
    if (typeof window === "undefined") return;

    try {
        window.localStorage.removeItem("app-theme");
        window.localStorage.removeItem("recently_viewed_project_ids");
    } catch {
        return;
    }
};

export const initializeCookieConsentServices = (consent: CookieConsent | null) => {
    if (!consent) return;

    if (consent.diagnostics) {
        setupSentry();
    }

    if (consent.analytics) {
        setupYandexMetrika();
        trackYandexMetrikaPageView(
            `${window.location.pathname}${window.location.search}${window.location.hash}`,
        );
    }
};

export const disableDisallowedTelemetryServices = (consent: CookieConsent | null) => {
    if (!consent?.analytics) {
        disableYandexMetrika();
    }
    if (!consent?.diagnostics) {
        disableSentry();
    }
};

export const hasRevokedOptionalServices = (previous: CookieConsent | null, next: CookieConsent) => {
    if (!previous) return false;

    return (previous.analytics && !next.analytics) || (previous.diagnostics && !next.diagnostics);
};

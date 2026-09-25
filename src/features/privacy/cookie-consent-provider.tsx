import * as React from "react";
import { Link } from "react-router";

import { paths } from "@/config/paths";
import { Button, type ButtonProps } from "@/components/ui/button/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog/dialog";
import { Switch } from "@/components/ui/switch/switch";
import {
    COOKIE_CONSENT_STORAGE_KEY,
    COOKIE_CONSENT_VERSION,
    clearFunctionalStorage,
    disableDisallowedTelemetryServices,
    getCookieConsent,
    getDefaultCookiePreferences,
    hasRevokedOptionalServices,
    initializeCookieConsentServices,
    storeCookieConsent,
    type CookieConsent,
    type CookiePreferences,
} from "@/features/privacy/cookie-consent";

type CookieConsentContextValue = {
    consent: CookieConsent | null;
    functionalEnabled: boolean;
    openSettings: () => void;
    savePreferences: (preferences: CookiePreferences) => void;
};

const CookieConsentContext = React.createContext<CookieConsentContextValue | null>(null);

const getPreferences = (consent: CookieConsent | null): CookiePreferences => {
    if (!consent) return getDefaultCookiePreferences();

    return {
        functional: consent.functional,
        analytics: consent.analytics,
        diagnostics: consent.diagnostics,
    };
};

const createConsent = (preferences: CookiePreferences): CookieConsent => ({
    version: COOKIE_CONSENT_VERSION,
    necessary: true,
    ...preferences,
    updatedAt: new Date().toISOString(),
});

const CookieSettingRow = ({
    id,
    title,
    description,
    checked,
    disabled,
    onCheckedChange,
}: {
    id: string;
    title: string;
    description: string;
    checked: boolean;
    disabled?: boolean;
    onCheckedChange?: (checked: boolean) => void;
}) => (
    <div className="flex items-start justify-between gap-6 border-b border-[--color-black-10] py-4 last:border-b-0 last:pb-0 first:pt-0">
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm font-semibold text-[--grey-27]">
                {title}
            </label>
            <p className="text-sm leading-5 text-[--azure-46]">{description}</p>
        </div>
        <Switch
            id={id}
            checked={checked}
            disabled={disabled}
            onCheckedChange={onCheckedChange}
            className="mt-0.5"
        />
    </div>
);

const CookieSettingsForm = ({
    preferences,
    onChange,
    onSave,
}: {
    preferences: CookiePreferences;
    onChange: (preferences: CookiePreferences) => void;
    onSave: () => void;
}) => (
    <div className="mt-6">
        <CookieSettingRow
            id="cookie-necessary"
            title="Необходимые"
            description="Нужны для авторизации, регистрации и сохранения выбора пользователя."
            checked
            disabled
        />
        <CookieSettingRow
            id="cookie-functional"
            title="Функциональные"
            description="Сохраняют тему оформления и список недавно просмотренных проектов."
            checked={preferences.functional}
            onCheckedChange={(checked) => onChange({ ...preferences, functional: checked })}
        />
        <CookieSettingRow
            id="cookie-analytics"
            title="Аналитические"
            description="Помогают оценить посещаемость и удобство страниц через Яндекс Метрику."
            checked={preferences.analytics}
            onCheckedChange={(checked) => onChange({ ...preferences, analytics: checked })}
        />
        <CookieSettingRow
            id="cookie-diagnostics"
            title="Диагностические"
            description="Передают технические ошибки и сведения о работе приложения в Sentry/GlitchTip."
            checked={preferences.diagnostics}
            onCheckedChange={(checked) => onChange({ ...preferences, diagnostics: checked })}
        />
        <div className="mt-6 flex justify-end">
            <Button type="button" variant="dark" size="hug48" onClick={onSave}>
                Сохранить настройки
            </Button>
        </div>
    </div>
);

const CookieConsentDialog = ({
    open,
    preferences,
    onOpenChange,
    onPreferencesChange,
    onSave,
}: {
    open: boolean;
    preferences: CookiePreferences;
    onOpenChange: (open: boolean) => void;
    onPreferencesChange: (preferences: CookiePreferences) => void;
    onSave: () => void;
}) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
                <DialogTitle>Настройки cookie</DialogTitle>
                <p className="mt-2 text-sm leading-5 text-[--azure-46]">
                    Выберите, какие данные можно использовать. Необходимые данные обеспечивают
                    работу авторизации и не отключаются.
                </p>
            </DialogHeader>
            <CookieSettingsForm
                preferences={preferences}
                onChange={onPreferencesChange}
                onSave={onSave}
            />
        </DialogContent>
    </Dialog>
);

const CookieConsentBanner = ({
    onAcceptAll,
    onNecessaryOnly,
    onOpenSettings,
}: {
    onAcceptAll: () => void;
    onNecessaryOnly: () => void;
    onOpenSettings: () => void;
}) => (
    <aside
        role="region"
        aria-label="Уведомление об использовании cookie"
        className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-[150] border-t border-[--color-black-10] bg-app-surface px-4 py-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] sm:bottom-0 sm:px-6"
    >
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-3xl text-sm leading-5 text-[--azure-46]">
                Мы используем cookie и данные локального хранилища для работы сервиса. С вашего
                согласия мы можем включать аналитику и диагностику.{" "}
                <Link
                    to={paths.legal.privacy.getHref()}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[--azure-54] hover:underline"
                >
                    Подробнее
                </Link>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
                <Button
                    type="button"
                    variant="dark"
                    size="hug36"
                    className="w-full sm:w-auto"
                    onClick={onAcceptAll}
                >
                    Принять все
                </Button>
                <Button
                    type="button"
                    variant="outline"
                    size="hug36"
                    className="w-full sm:w-auto"
                    onClick={onNecessaryOnly}
                >
                    Только необходимые
                </Button>
                <Button
                    type="button"
                    variant="outlineSoft"
                    size="hug36"
                    className="w-full sm:w-auto"
                    onClick={onOpenSettings}
                >
                    Настроить
                </Button>
            </div>
        </div>
    </aside>
);

export const CookieConsentProvider = ({ children }: { children: React.ReactNode }) => {
    const [consent, setConsent] = React.useState<CookieConsent | null>(() => getCookieConsent());
    const [settingsOpen, setSettingsOpen] = React.useState(false);
    const [preferences, setPreferences] = React.useState<CookiePreferences>(() =>
        getPreferences(getCookieConsent()),
    );
    const consentRef = React.useRef(consent);

    React.useEffect(() => {
        consentRef.current = consent;
    }, [consent]);

    React.useEffect(() => {
        if (!consent || !consent.functional) {
            clearFunctionalStorage();
        }
    }, [consent]);

    React.useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key !== COOKIE_CONSENT_STORAGE_KEY) return;

            const nextConsent = getCookieConsent();
            const previousConsent = consentRef.current;
            consentRef.current = nextConsent;
            setConsent(nextConsent);
            disableDisallowedTelemetryServices(nextConsent);

            if (nextConsent) {
                if (!nextConsent.functional) {
                    clearFunctionalStorage();
                }
                initializeCookieConsentServices(nextConsent);
            }

            if (
                previousConsent &&
                (!nextConsent || hasRevokedOptionalServices(previousConsent, nextConsent))
            ) {
                window.location.reload();
            }
        };

        window.addEventListener("storage", handleStorage);
        return () => window.removeEventListener("storage", handleStorage);
    }, []);

    const savePreferences = React.useCallback((nextPreferences: CookiePreferences) => {
        const nextConsent = createConsent(nextPreferences);
        const previousConsent = consentRef.current;
        const requiresReload = hasRevokedOptionalServices(previousConsent, nextConsent);

        if (!nextConsent.functional) {
            clearFunctionalStorage();
        }

        storeCookieConsent(nextConsent);
        consentRef.current = nextConsent;
        setConsent(nextConsent);
        setSettingsOpen(false);
        disableDisallowedTelemetryServices(nextConsent);
        initializeCookieConsentServices(nextConsent);

        if (requiresReload) {
            window.location.reload();
        }
    }, []);

    const openSettings = React.useCallback(() => {
        setPreferences(getPreferences(consentRef.current));
        setSettingsOpen(true);
    }, []);

    const value = React.useMemo(
        () => ({
            consent,
            functionalEnabled: consent?.functional ?? false,
            openSettings,
            savePreferences,
        }),
        [consent, openSettings, savePreferences],
    );

    return (
        <CookieConsentContext.Provider value={value}>
            {children}
            {!consent && (
                <CookieConsentBanner
                    onAcceptAll={() =>
                        savePreferences({ functional: true, analytics: true, diagnostics: true })
                    }
                    onNecessaryOnly={() =>
                        savePreferences({ functional: false, analytics: false, diagnostics: false })
                    }
                    onOpenSettings={openSettings}
                />
            )}
            <CookieConsentDialog
                open={settingsOpen}
                preferences={preferences}
                onOpenChange={setSettingsOpen}
                onPreferencesChange={setPreferences}
                onSave={() => savePreferences(preferences)}
            />
        </CookieConsentContext.Provider>
    );
};

export const useCookieConsent = (): CookieConsentContextValue => {
    const context = React.useContext(CookieConsentContext);
    if (!context) {
        throw new Error("useCookieConsent must be used within CookieConsentProvider");
    }
    return context;
};

type CookieConsentSettingsButtonProps = Pick<ButtonProps, "variant" | "size" | "className"> & {
    children?: React.ReactNode;
};

export const CookieConsentSettingsButton = ({
    children = "Настроить cookie",
    ...props
}: CookieConsentSettingsButtonProps) => {
    const { openSettings } = useCookieConsent();

    return (
        <Button type="button" onClick={openSettings} {...props}>
            {children}
        </Button>
    );
};

export const CookieConsentSettingsSection = () => {
    const { openSettings } = useCookieConsent();

    return (
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
            <div className="p-6">
                <h2 className="text-[17px] font-semibold text-[--grey-4]">
                    Cookie и локальное хранилище
                </h2>
                <p className="mt-1 text-sm leading-5 text-[--azure-46]">
                    Управляйте сохранением функциональных данных, аналитикой и диагностикой.
                </p>
                <Button
                    type="button"
                    variant="outline"
                    size="hug36"
                    className="mt-4"
                    onClick={openSettings}
                >
                    Настроить
                </Button>
            </div>
        </div>
    );
};

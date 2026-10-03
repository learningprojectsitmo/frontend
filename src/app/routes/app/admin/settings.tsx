import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { ContentLayout } from "@/components/layouts";
import { Spinner } from "@/components/ui/spinner/spinner";
import { Switch } from "@/components/ui/switch/switch";
import { useAdminAppSettings, useUpdateAppSettings } from "@/lib/app-settings";
import { queryKeys } from "@/lib/query-keys";
import type { AppSettingItem, AppSettingsAdminResponse } from "@/types/api";

/**
 * Глобальные настройки инстанса. Список приходит с сервера из реестра
 * (`src/core/app_settings_registry.py`), поэтому новая настройка появляется
 * здесь без правок в логике — только перевод в i18n.
 */
const AdminSettingsPage = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { data, isLoading, isError } = useAdminAppSettings();
    const updateSettings = useUpdateAppSettings();

    const items = data?.items ?? [];

    const handleToggle = (item: AppSettingItem, checked: boolean) => {
        // Оптимистичное обновление прямо в кэше: тумблер откликается сразу,
        // а не после round-trip. useUpdateAppSettings инвалидирует кэш при
        // успехе, поэтому серверное значение догонит без мерцания.
        queryClient.setQueryData<AppSettingsAdminResponse>(
            queryKeys.appSettings.admin(),
            (previous) =>
                previous
                    ? {
                          items: previous.items.map((current) =>
                              current.key === item.key ? { ...current, value: checked } : current,
                          ),
                      }
                    : previous,
        );

        updateSettings.mutate(
            { [item.key]: checked },
            {
                onSuccess: () => toast.success(t("adminSettings.saved")),
                onError: () => {
                    toast.error(t("adminSettings.saveError"));
                    // Возвращаем серверное значение — оптимистичный toggle
                    // мог не дойти до сервера.
                    queryClient.invalidateQueries({ queryKey: queryKeys.appSettings.admin() });
                },
            },
        );
    };

    return (
        <ContentLayout title={t("adminSettings.title")}>
            <div className="mx-auto max-w-3xl p-6">
                <div className="mb-8">
                    <h1 className="mb-1 text-2xl font-bold text-[--grey-4]">
                        {t("adminSettings.title")}
                    </h1>
                    <p className="text-sm text-[--azure-46]">{t("adminSettings.subtitle")}</p>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-24">
                        <Spinner size="lg" />
                    </div>
                ) : isError ? (
                    <div className="text-center py-16 text-sm text-[--azure-46]">
                        {t("adminSettings.loadError")}
                    </div>
                ) : (
                    <div className="w-full overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
                        {items.map((item, index) => (
                            <SettingRow
                                key={item.key}
                                item={item}
                                last={index === items.length - 1}
                                checked={item.value === true}
                                disabled={
                                    updateSettings.isPending &&
                                    updateSettings.variables?.[item.key] === item.value
                                }
                                onToggle={handleToggle}
                            />
                        ))}
                    </div>
                )}
            </div>
        </ContentLayout>
    );
};

const SettingRow = ({
    item,
    last,
    checked,
    disabled,
    onToggle,
}: {
    item: AppSettingItem;
    last: boolean;
    checked: boolean;
    disabled: boolean;
    onToggle: (item: AppSettingItem, checked: boolean) => void;
}) => {
    const { t } = useTranslation();

    // Второй аргумент t() — значение по умолчанию: если для нового ключа ещё
    // не завели перевод, покажется текст из серверного реестра.
    const title = t(`adminSettings.flags.${item.key}.title`, item.title);
    const description = t(`adminSettings.flags.${item.key}.description`, item.description);

    return (
        <div
            className={`flex items-start justify-between gap-6 px-6 py-4${
                last ? "" : " border-b border-[--color-black-10]"
            }`}
        >
            <div className="space-y-1">
                <label
                    htmlFor={`app-setting-${item.key}`}
                    className="block text-sm font-semibold text-[--grey-4]"
                >
                    {title}
                </label>
                <p className="text-sm leading-5 text-[--azure-46]">{description}</p>
            </div>

            {item.kind === "bool" ? (
                <Switch
                    id={`app-setting-${item.key}`}
                    checked={checked}
                    disabled={disabled}
                    onCheckedChange={(next) => onToggle(item, next)}
                    className="mt-0.5 shrink-0"
                />
            ) : (
                <span className="shrink-0 pt-0.5 text-sm text-[--azure-46]">
                    {String(item.value ?? "—")}
                </span>
            )}
        </div>
    );
};

export default AdminSettingsPage;

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useEffect, useState } from "react";

import { Switch } from "@/components/ui/switch/switch";
import { usePublicAppSettings } from "@/lib/app-settings";
import { useUser } from "@/lib/auth";
import { queryKeys } from "@/lib/query-keys";
import { settingsApi } from "@/lib/settings";
import type { User } from "@/types/api";

/**
 * Персональный тумблер праздничного декора.
 *
 * Админ включает украшения глобально, а здесь пользователь может спрятать их
 * только у себя (`show_decorations`). Пока админ не включил ни один вид
 * декора, управлять нечем — секция не показывается.
 */
export const DecorationsSection = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const { data: user } = useUser();
    const { data: settings } = usePublicAppSettings();

    const adminEnabled =
        settings?.new_year_decorations_enabled === true ||
        settings?.halloween_decorations_enabled === true;

    const [localChecked, setLocalChecked] = useState(user?.show_decorations !== false);

    useEffect(() => {
        if (user) {
            setLocalChecked(user.show_decorations !== false);
        }
    }, [user]);

    const updateDecorations = useMutation({
        mutationFn: async (show: boolean) => {
            if (!user) return;
            await settingsApi.updateUserDecorations(user.id, show);
        },
        onMutate: async (show: boolean) => {
            setLocalChecked(show);
            await queryClient.cancelQueries({ queryKey: queryKeys.user() });
            const previous = queryClient.getQueryData<User>(queryKeys.user());
            if (previous) {
                queryClient.setQueryData<User>(queryKeys.user(), {
                    ...previous,
                    show_decorations: show,
                });
            }
            return { previous };
        },
        onSuccess: () => {
            toast.success(t("settings.decorationsSaved"));
        },
        onError: (_error, _variables, context) => {
            setLocalChecked(context?.previous?.show_decorations !== false);
            if (context?.previous) {
                queryClient.setQueryData<User>(queryKeys.user(), context.previous);
            }
            toast.error(t("settings.decorationsSaveError"));
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.user() });
        },
    });

    if (!adminEnabled || !user) {
        return null;
    }

    // По умолчанию украшения включены: галочка снята только при явном `false`.
    const checked = localChecked;

    return (
        <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[--color-black-10] bg-app-surface">
            <div className="p-6">
                <div className="flex items-start justify-between gap-6">
                    <div className="space-y-1">
                        <h2 className="text-[17px] font-semibold text-[--grey-4]">
                            {t("settings.decorations")}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-[--azure-46]">
                            {t("settings.decorationsDescription")}
                        </p>
                    </div>
                    <Switch
                        id="user-show-decorations"
                        checked={checked}
                        disabled={updateDecorations.isPending}
                        onCheckedChange={(next) => updateDecorations.mutate(next)}
                        className="mt-0.5 shrink-0"
                    />
                </div>
            </div>
        </div>
    );
};

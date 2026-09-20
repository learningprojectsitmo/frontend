import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import { Icon } from "@/components/ui/icons";
import { useProfile, useUpdateOwnProfile } from "@/lib/profile";

const inlineEditSchema = z.object({
    last_name: z.string().max(64).optional().or(z.literal("")),
    first_name: z.string().min(1, "Имя обязательно").max(64),
    middle_name: z.string().max(64).optional().or(z.literal("")),
    phone: z
        .string()
        .max(32)
        .optional()
        .or(z.literal(""))
        .or(z.string().regex(/^[+\d ()-]{1,32}$/, "Некорректный номер телефона")),
    tg_nickname: z.string().max(64).optional().or(z.literal("")),
    vk_nickname: z.string().max(64).optional().or(z.literal("")),
});

type InlineEditProfileInput = z.infer<typeof inlineEditSchema>;

type ProfileEditFormProps = {
    onCancel: () => void;
};

export const ProfileEditForm = ({ onCancel }: ProfileEditFormProps) => {
    const { data: profile } = useProfile();
    const updateOwnProfile = useUpdateOwnProfile();

    const form = useForm<InlineEditProfileInput>({
        resolver: zodResolver(inlineEditSchema),
        values: {
            last_name: profile?.last_name ?? "",
            first_name: profile?.first_name ?? "",
            middle_name: profile?.middle_name ?? "",
            phone: profile?.phone ?? "",
            tg_nickname: profile?.tg_nickname ?? "",
            vk_nickname: profile?.vk_nickname ?? "",
        },
    });

    const handleSubmit = (values: InlineEditProfileInput) => {
        if (!profile) return;
        updateOwnProfile.mutate(
            {
                id: profile.id,
                data: {
                    last_name: values.last_name || undefined,
                    first_name: values.first_name,
                    middle_name: values.middle_name || undefined,
                    phone: values.phone || undefined,
                    tg_nickname: values.tg_nickname || undefined,
                    vk_nickname: values.vk_nickname || undefined,
                },
            },
            {
                onSuccess: () => {
                    toast.success("Профиль сохранён");
                    onCancel();
                },
                onError: () => {
                    toast.error("Ошибка при сохранении профиля");
                },
            },
        );
    };

    return (
        <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="rounded-2xl border border-gray-200 bg-app-surface p-4 sm:p-6 flex flex-col sm:flex-row gap-6 sm:gap-8"
        >
            <div className="h-[80px] w-[80px] sm:h-[120px] sm:w-[120px] rounded-[20px] bg-gradient-to-br from-gray-800 to-gray-600 flex items-center justify-center text-white text-4xl font-bold shrink-0">
                {form.watch("last_name").trim().charAt(0)}
                {form.watch("first_name").trim().charAt(0)}
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                                    Фамилия
                                </label>
                                <Input
                                    placeholder="Фамилия"
                                    error={!!form.formState.errors.last_name}
                                    helperText={form.formState.errors.last_name?.message}
                                    {...form.register("last_name")}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                                    Имя
                                </label>
                                <Input
                                    placeholder="Имя"
                                    error={!!form.formState.errors.first_name}
                                    helperText={form.formState.errors.first_name?.message}
                                    {...form.register("first_name")}
                                />
                            </div>
                            <div>
                                <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                                    Отчество
                                </label>
                                <Input
                                    placeholder="Отчество"
                                    helperText={form.formState.errors.middle_name?.message}
                                    {...form.register("middle_name")}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <Button type="button" variant="outline" size="hug36" onClick={onCancel}>
                            Отмена
                        </Button>
                        <Button
                            type="submit"
                            size="hug36"
                            loading={updateOwnProfile.isPending}
                            disabled={updateOwnProfile.isPending}
                        >
                            Сохранить
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4 mt-6">
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Контакты
                        </p>
                        <div className="flex flex-col gap-3">
                            {profile?.email && (
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <Icon name="mail" size={14} className="text-gray-400" />
                                    {profile.email}
                                </div>
                            )}
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <Icon name="clock" size={14} className="text-gray-400" />
                                <Input
                                    placeholder="+7 (900) 000-00-00"
                                    error={!!form.formState.errors.phone}
                                    helperText={form.formState.errors.phone?.message}
                                    {...form.register("phone")}
                                />
                            </label>
                        </div>
                    </div>
                    <div>
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                            Соцсети
                        </p>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <Icon name="telegram" size={14} className="text-gray-400" />
                                <Input
                                    placeholder="@username"
                                    helperText={form.formState.errors.tg_nickname?.message}
                                    {...form.register("tg_nickname")}
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <Icon name="vk" size={14} className="text-gray-400" />
                                <Input
                                    placeholder="@username"
                                    helperText={form.formState.errors.vk_nickname?.message}
                                    {...form.register("vk_nickname")}
                                />
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
};

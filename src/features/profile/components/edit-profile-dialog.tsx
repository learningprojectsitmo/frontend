import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form/form";
import { useProfile, useUpdateOwnProfile } from "@/lib/profile";

const editProfileSchema = z.object({
    last_name: z.string().max(64).optional().or(z.literal("")),
    first_name: z.string().min(1, "Имя обязательно").max(64),
    middle_name: z.string().max(64).optional().or(z.literal("")),
    phone: z
        .string()
        .max(32)
        .optional()
        .or(z.literal(""))
        .or(z.regex(/^[+\d ()-]{1,32}$/, "Некорректный номер телефона")),
    tg_nickname: z.string().max(64).optional().or(z.literal("")),
    vk_nickname: z.string().max(64).optional().or(z.literal("")),
});

type EditProfileInput = z.infer<typeof editProfileSchema>;

type EditProfileDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

export const EditProfileDialog = ({ open, onOpenChange }: EditProfileDialogProps) => {
    const { data: profile } = useProfile();
    const updateOwnProfile = useUpdateOwnProfile();

    const form = useForm<EditProfileInput>({
        resolver: zodResolver(editProfileSchema),
        values: {
            last_name: profile?.last_name ?? "",
            first_name: profile?.first_name ?? "",
            middle_name: profile?.middle_name ?? "",
            phone: profile?.phone ?? "",
            tg_nickname: profile?.tg_nickname ?? "",
            vk_nickname: profile?.vk_nickname ?? "",
        },
    });

    const onSubmit = (values: EditProfileInput) => {
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
                    toast.success("Профиль обновлён");
                    onOpenChange(false);
                },
                onError: () => {
                    toast.error("Ошибка при сохранении профиля");
                },
            },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Редактировать профиль</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                        <FormField
                            control={form.control}
                            name="last_name"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Фамилия</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Фамилия"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="first_name"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Имя</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Имя"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="middle_name"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Отчество</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Отчество"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Номер телефона</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="+7 (900) 000-00-00"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                            Соцсети
                        </div>
                        <FormField
                            control={form.control}
                            name="tg_nickname"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>Telegram</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="@username"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vk_nickname"
                            render={({ field, fieldState }) => (
                                <FormItem>
                                    <FormLabel>ВКонтакте</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="@username"
                                            error={!!fieldState.error}
                                            helperText={fieldState.error?.message}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="hug36"
                                onClick={() => onOpenChange(false)}
                            >
                                Отмена
                            </Button>
                            <Button
                                type="submit"
                                size="hug36"
                                disabled={updateOwnProfile.isPending}
                                loading={updateOwnProfile.isPending}
                            >
                                Сохранить
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

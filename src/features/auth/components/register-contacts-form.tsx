import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { Checkbox } from "@/components/ui/checkbox/checkbox";
import { useUpdateContacts, useUser, telegramSchema, vkSchema } from "@/lib/auth";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import { notifyError } from "@/components/ui/notifications";

const registerContactsInputSchema = z.object({
    telegram: telegramSchema,
    vk: vkSchema,
    showMyContacts: z.boolean().default(false),
});

type RegisterContactsFormInput = z.infer<typeof registerContactsInputSchema>;

export const RegistrationContactsForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const { data: user, isLoading } = useUser();
    const updateContacts = useUpdateContacts(user?.id ?? 0);
    const [showPublicityText, setShowPublicityText] = useState(false);

    const form = useForm<RegisterContactsFormInput>({
        resolver: zodResolver(registerContactsInputSchema),
        defaultValues: {
            telegram: "",
            vk: "",
            showMyContacts: false,
        },
    });

    const onSubmit = async (values: RegisterContactsFormInput) => {
        try {
            await updateContacts.mutateAsync(values);
            onSuccess();
        } catch {
            notifyError("Ошибка при сохранении контактов");
        }
    };

    const handleSkip = () => {
        onSuccess();
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[300px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="bg-white w-full max-w-[520px] px-12 py-8 bg-white rounded-2xl ">
            <div className="flex justify-center mb-8">
                <Icon name="logo-edu-flow" width={120} height={32} alt="EduFlow Logo" />
            </div>
            <h2 className="text-heading-3 font-semibold mb-8 text-grey-400 font-sans">
                Поделитесь своими контактами
            </h2>
            <h4 className="mb-12 text-body font-medium font-sans text-[#4A5565]">
                Введите свой никнейм. По умолчанию ваши контакты видны другим пользователям
            </h4>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="telegram"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        placeholder="@yournickname"
                                        {...field}
                                        error={!!fieldState.error}
                                        className="h-12 border-gray-300"
                                        helperText={fieldState.error?.message}
                                        icon={
                                            <Icon
                                                name="telegram"
                                                size={18}
                                                className="absolute -top-2"
                                            />
                                        }
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="vk"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            placeholder="@yournickname"
                                            error={!!fieldState.error}
                                            {...field}
                                            className="h-12 border-gray-300 pr-10"
                                            helperText={fieldState.error?.message}
                                            icon={
                                                <Icon
                                                    name="vk"
                                                    size={18}
                                                    className="absolute -top-2"
                                                />
                                            }
                                        />
                                    </div>
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                            <FormField
                                control={form.control}
                                name="showMyContacts"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(v) => {
                                                    setShowPublicityText(Boolean(v));
                                                    field.onChange(v);
                                                }}
                                                id="showMyContacts"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <label
                                htmlFor="showMyContacts"
                                className="font-normal font-sans text-signature leading-none cursor-pointer"
                            >
                                Показывать мои контакты другим пользователям
                            </label>
                        </div>
                    </div>

                    {showPublicityText ? (
                        <p className="text-sm text-blue-600 font-sans">
                            Отметив эту галочку, вы разрешите другим пользователям связаться с вами.
                            Ваши профили в Telegram и VK будут видны всем участникам.
                        </p>
                    ) : null}

                    <Button
                        type="submit"
                        // className="w-full h-12 bg-[#050511] hover:bg-black text-white rounded-lg text-lg font-semibold"
                        className="w-full h-12 bg-[#030213] text-white"
                        disabled={updateContacts.isPending}
                    >
                        {updateContacts.isPending ? "Сохранить..." : "Сохранить"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full h-12 border-gray-200"
                        onClick={handleSkip}
                        disabled={updateContacts.isPending}
                    >
                        Пропустить
                    </Button>
                </form>
            </Form>

            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-left">
                <Link
                    to="#"
                    className="text-blue-600 font-semibold font-sans text-signature flex items-center gap-2"
                >
                    <Icon name="help" size={16} />
                    Помощь и поддержка
                </Link>
            </div>
        </div>
    );
};

import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { Checkbox } from "@/components/ui/checkbox/checkbox";
import { telegramSchema, vkSchema, useRegister } from "@/lib/auth";

type RegistrationContactsFormProps = {
    onSuccess: () => void;
};

const RegistrationContactsFormSchema = z
    .object({
        telegram: telegramSchema,
        vk: vkSchema,
        showMyContacts: z.boolean().default(false),
    })

export type RegistrationContactsFormInput = z.infer<typeof RegistrationContactsFormSchema>;

export const RegistrationContactsForm = ({ onSuccess }: RegistrationContactsFormProps) => {
    const register = useRegister({ onSuccess });

    const form = useForm<RegistrationContactsFormInput>({
        resolver: zodResolver(RegistrationContactsFormSchema),
        defaultValues: {
            telegram: "",
            vk: "",
            showMyContacts: false,
        },
    });

    const onSubmit = (values: RegistrationContactsFormInput) => {
        const sessionData = JSON.parse(sessionStorage.getItem('register') || '{}');
        register.mutate({
            email: sessionData.email || "", 
            password: sessionData.password || "", 
            telegram: values.telegram, 
            vk: values.vk,
            showMyContacts: values.showMyContacts || false,
        });
    };

    return (
        <div className="bg-white w-full max-w-[560px] px-12 py-8 bg-white rounded-2xl ">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">EduSpace</h1>
            <h2 className="text-3xl font-semibold mb-8 text-grey-400">Поделитесь своими контактами</h2>
            <h4 className="mb-16 text-xl text-grey-400 text-[#4A5565]">
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
                                    />
                                </FormControl>
                                <FormMessage className="text-[#FB2C36]" />{" "}
                                {/* Текст ошибки тоже красим */}
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
                                        />
                                    </div>
                                </FormControl>
                                <FormMessage />
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
                                                onCheckedChange={field.onChange}
                                                id="showMyContacts"
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                            <label
                                htmlFor="showMyContacts"
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                Показывать мои контакты другим пользователям
                            </label>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        // className="w-full h-12 bg-[#050511] hover:bg-black text-white rounded-lg text-lg font-semibold"
                        className="w-full h-12 bg-[#030213] text-white text-lg font-semibold"
                        disabled={register.isPending}
                    >
                        {register.isPending ? "Сохранить..." : "Сохранить"}
                    </Button>

                    <Button
                        type="submit"
                        variant="outline"
                        className="w-full h-12 border-gray-200 text-lg font-semibold"
                        asChild
                        disabled={register.isPending}
                    >
                        {register.isPending ? "Пропустить..." : "Пропустить"}
                    </Button>
                </form>
            </Form>

            <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-left">
                <Link to="#" className="text-blue-600 text-sm flex items-center gap-2">
                    <span className="rounded-full border border-blue-600 w-4 h-4 flex items-center justify-center text-[10px]">
                        ?
                    </span>
                    Помощь и поддержка
                </Link>
            </div>
        </div>
    );
};

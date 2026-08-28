import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { useUpdateFullName, useUser } from "@/lib/auth";
import { Icon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/spinner/spinner";
import { notifyError } from "@/components/ui/notifications";

// Часть имени: буква в начале, далее буквы/дефис/апостроф/точка (кириллица и латиница).
const namePartPattern = /^[\p{L}][\p{L}'\-.]*$/u;

const nameField = (label: string, requiredMessage: string) =>
    z
        .string()
        .trim()
        .min(1, requiredMessage)
        .regex(
            /^[\p{L}'\-.\s]+$/u,
            `${label} может содержать только буквы, дефис, апостроф и пробел`,
        )
        .refine((value) => value.split(/\s+/).every((token) => namePartPattern.test(token)), {
            message: `${label} введено некорректно`,
        });

const registerNameInputSchema = z.object({
    first_name: nameField("Имя", "Обязательное поле"),
    // Отчество необязательно — у иностранных имён его может не быть.
    middle_name: z
        .string()
        .trim()
        .regex(
            /^[\p{L}'\-.\s]*$/u,
            "Отчество может содержать только буквы, дефис, апостроф и пробел",
        )
        .refine((value) => value.split(/\s+/).every((token) => namePartPattern.test(token)), {
            message: "Отчество введено некорректно",
        }),
    last_name: nameField("Фамилия", "Обязательное поле"),
});

type RegisterNameFormInput = z.infer<typeof registerNameInputSchema>;

export const RegisterNameForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const { data: user, isLoading } = useUser();
    const updateFullName = useUpdateFullName(user?.id ?? 0);

    const form = useForm<RegisterNameFormInput>({
        resolver: zodResolver(registerNameInputSchema),
        defaultValues: {
            first_name: "",
            middle_name: "",
            last_name: "",
        },
    });

    const onSubmit = async (values: RegisterNameFormInput) => {
        try {
            await updateFullName.mutateAsync(values);
            onSuccess();
        } catch {
            notifyError("Ошибка при сохранении данных");
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-[300px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="bg-app-surface w-full max-w-[520px] px-12 py-8 bg-app-surface rounded-2xl ">
            <div className="flex place-content-between width-full mb-8">
                <Link to="#" className="w-9 h-9 flex items-center">
                    <Icon name="arrow-left" width={20} height={20} />
                </Link>
                <Icon name="logo-edu-flow" width={120} height={32} alt="EduFlow Logo" />
                <div className="w-9 h-9"></div>
            </div>
            <h2 className="text-heading-3 font-semibold mb-8 text-grey-400 font-sans">
                Как вас зовут?
            </h2>
            <h4 className="mb-12 text-grey-400 text-gray-600 font-medium font-sans text-body">
                Введите имя и фамилию. Отчество — по желанию. Можно ввести имя латиницей.
            </h4>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="last_name"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        placeholder="Фамилия"
                                        {...field}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                        className="h-12 border-gray-300"
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
                                <FormControl>
                                    <Input
                                        placeholder="Имя"
                                        {...field}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                        className="h-12 border-gray-300"
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
                                <FormControl>
                                    <Input
                                        placeholder="Отчество"
                                        {...field}
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                        className="h-12 border-gray-300"
                                    />
                                </FormControl>
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        className="w-full h-12 bg-[#030213] text-white"
                        disabled={updateFullName.isPending}
                    >
                        {updateFullName.isPending ? "Сохранить..." : "Продолжить"}
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

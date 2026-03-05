import { Link } from "react-router"; //useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { useResetWithPassword } from "@/lib/auth";

const resetPasswordFormSchema = z
    .object({
        password: z.string().min(8, "Пароль должен быть минимум 8 символов"),
        passwordConfirmation: z.string().min(1, "Подтвердите пароль"),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
        message: "Пароли не совпадают",
        path: ["passwordConfirmation"],
    });

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;

type ResetPasswordFormProps = {
    onSuccess: () => void;
};

export const ResetPasswordForm = ({ onSuccess }: ResetPasswordFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const resetEmail = useResetWithPassword({ onSuccess });
    const form = useForm<ResetPasswordFormInput>({
        resolver: zodResolver(resetPasswordFormSchema),
        defaultValues: {
            password: "",
            passwordConfirmation: "",
        },
    });

    const onSubmit = (values: ResetPasswordFormInput) => {
        resetEmail.mutate({
            password: values.password,
            special_token: "12345678-1234-1234-1234-123456789012",
        }); //вместо статического токена должен быть реальный токен из ссылки на почту, который можно получить через useSearchParams
    };

    return (
        <div className="bg-white w-full max-w-[560px] px-12 py-8 bg-white rounded-2xl ">
            <h1 className="text-heading-4 font-sans font-semibold text-center text-blue-600 mb-8">
                EduSpace
            </h1>
            <h2 className="text-heading-3 font-semibold mb-8 text-grey-400 font-sans">
                Создание нового пароля
            </h2>
            <h4 className="mb-12 text-body font-medium font-sans text-[#4A5565]">
                Создайте новый пароль для своей учетной записи
            </h4>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        name="email"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        placeholder="E-mail"
                                        {...field}
                                        error={!!fieldState.error}
                                        className="h-12 border-gray-300"
                                        disabled
                                    />
                                </FormControl>
                                <FormMessage className="text-[#FB2C36]" />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Пароль"
                                            error={!!fieldState.error}
                                            {...field}
                                            className="h-12 border-gray-300 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        >
                                            {showPassword ? (
                                                <EyeOffIcon size={20} />
                                            ) : (
                                                <EyeIcon size={20} />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[#FB2C36]" />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="passwordConfirmation"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Подтвердите пароль"
                                            error={!!fieldState.error}
                                            {...field}
                                            className="h-12 border-gray-300 pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        >
                                            {showPassword ? (
                                                <EyeOffIcon size={20} />
                                            ) : (
                                                <EyeIcon size={20} />
                                            )}
                                        </button>
                                    </div>
                                </FormControl>
                                <FormMessage className="text-[#FB2C36]" />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        // className="w-full h-12 bg-[#050511] hover:bg-black text-white rounded-lg text-lg font-semibold"
                        className="w-full h-12 bg-[#030213] text-white"
                        disabled={resetEmail.isPending || resetEmail.isSuccess}
                    >
                        {resetEmail.isPending ? "Подтвердить..." : "Подтвердить"}
                    </Button>
                </form>
            </Form>

            <div className="mt-8 pt-4 border-t border-gray-200 flex items-center justify-left">
                <Link
                    to="#"
                    className="text-blue-600 flex items-center gap-2 font-semibold font-sans text-signature"
                >
                    <span className="rounded-full border border-blue-600 w-4 h-4 flex items-center justify-center text-[10px]">
                        ?
                    </span>
                    Помощь и поддержка
                </Link>
            </div>
        </div>
    );
};

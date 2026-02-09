import { Link } from "react-router"; //useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { useResetWithPassword, type ResetWithPasswordInput } from "@/lib/auth";

const RegistrationFormSchema = z
    .object({
        email: z.string().min(1, "Required").email("Invalid email"),
        password: z.string().min(8, "Пароль должен быть минимум 8 символов"),
        passwordConfirmation: z.string().min(1, "Подтвердите пароль"),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
        message: "Пароли не совпадают",
        path: ["passwordConfirmation"],
    });

type RegistrationFormInput = z.infer<typeof RegistrationFormSchema>;

export const RegistrationFormForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const resetEmail = useResetWithPassword();
    const form = useForm<RegistrationFormInput>({
        resolver: zodResolver(RegistrationFormSchema),
        defaultValues: {
            email: "",
            password: "",
            passwordConfirmation: "",
        },
    });

    const onSubmit = (values: ResetWithPasswordInput) => {
        resetEmail.mutate({ password: values.password });
    };

    return (
        <div className="bg-white w-full max-w-[560px] px-12 py-8 bg-white rounded-2xl ">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">EduSpace</h1>
            <h2 className="text-3xl font-semibold mb-8 text-grey-400">Создание нового аккаунта</h2>
            <h4 className="mb-16 text-xl text-grey-400 text-[#4A5565]">
                Введите свой адрес электронной почты и создайте пароль
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
                                    />
                                </FormControl>
                                <FormMessage className="text-[#FB2C36]" />{" "}
                                {/* Текст ошибки тоже красим */}
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
                                <FormMessage />
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
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button
                        type="submit"
                        // className="w-full h-12 bg-[#050511] hover:bg-black text-white rounded-lg text-lg font-semibold"
                        className="w-full h-12 bg-[#030213] text-white text-lg font-semibold"
                        disabled={resetEmail.isPending || resetEmail.isSuccess}
                    >
                        {resetEmail.isPending ? "Подтвердить..." : "Подтвердить"}
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

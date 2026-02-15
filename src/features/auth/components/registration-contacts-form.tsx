import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { Checkbox } from "@/components/ui/checkbox/checkbox";
import { paths } from "@/config/paths";
import { useLogin, loginInputSchema, type LoginInput } from "@/lib/auth";

type LoginFormProps = {
    onSuccess: () => void;
};

export const LoginForm = ({ onSuccess }: LoginFormProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const login = useLogin({ onSuccess });
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    const form = useForm<LoginInput>({
        resolver: zodResolver(loginInputSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = (values: LoginInput) => {
        login.mutate(values);
    };

    return (
        <div className="bg-white w-full max-w-[560px] px-12 py-8 bg-white rounded-2xl ">
            <h1 className="text-3xl font-bold text-center text-blue-600 mb-8">EduSpace</h1>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
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

                    <div className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                            <Checkbox id="remember" />
                            <label
                                htmlFor="remember"
                                className="text-sm font-medium leading-none cursor-pointer"
                            >
                                Запомнить меня
                            </label>
                        </div>
                        <Link
                            to={paths.auth.resetEmail.getHref(redirectTo)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Сбросить пароль
                        </Link>
                    </div>

                    <Button
                        type="submit"
                        // className="w-full h-12 bg-[#050511] hover:bg-black text-white rounded-lg text-lg font-semibold"
                        className="w-full h-12 bg-[#030213] text-white text-lg font-semibold"
                        disabled={login.isPending}
                    >
                        {login.isPending ? "Вход..." : "Вход"}
                    </Button>

                    <Button
                        variant="outline"
                        className="w-full h-12 border-gray-200 text-lg font-semibold"
                        asChild
                    >
                        <Link to={paths.auth.register.getHref(redirectTo)}>Регистрация</Link>
                    </Button>
                </form>
            </Form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-500">или войдите с помощью</span>
                </div>
            </div>

            <div className="flex justify-center space-x-8">
                <button className="hover:opacity-80 transition-opacity">
                    <span className="font-bold text-lg">ITMO ID</span>
                </button>
                <button className="hover:opacity-80 transition-opacity">
                    <img src="/yandex-icon.svg" alt="Yandex" className="size-8" />
                </button>
                <button className="hover:opacity-80 transition-opacity">
                    <img src="/github-icon.svg" alt="GitHub" className="size-8" />
                </button>
            </div>

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

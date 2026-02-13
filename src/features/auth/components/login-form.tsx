import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useState } from "react";

import { Button, IconButton } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form/form";
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
                                        type="email"
                                        placeholder="E-mail"
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
                        name="password"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <Input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Введите пароль"
                                        error={!!fieldState.error}
                                        helperText={fieldState.error?.message}
                                        rightIcon={
                                            <IconButton
                                                variant="ghost"
                                                icon={
                                                    showPassword ? (
                                                        <EyeOffIcon size={18} />
                                                    ) : (
                                                        <EyeIcon size={18} />
                                                    )
                                                }
                                                onClick={() => setShowPassword(!showPassword)}
                                                type="button"
                                                className="text-[#0A0A0A] hover:bg-transparent active:bg-transparent"
                                            />
                                        }
                                        {...field}
                                    />
                                </FormControl>
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
                            to={paths.auth.reset.getHref(redirectTo)}
                            className="text-sm text-blue-600 hover:underline"
                        >
                            Сбросить пароль
                        </Link>
                    </div>

                    <Button
                        variant="dark"
                        size="fill48"
                        type="submit"
                        className="text-lg font-semibold"
                        disabled={login.isPending}
                    >
                        {login.isPending ? "Вход..." : "Вход"}
                    </Button>

                    <Button
                        variant="outlineSoft"
                        size="fill48"
                        className="text-lg font-semibold"
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

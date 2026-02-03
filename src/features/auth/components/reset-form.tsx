import { Link } from "react-router";//useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
//import { Checkbox } from "@/components/ui/checkbox/checkbox";
//import { paths } from "@/config/paths";
import { useLogin, loginInputSchema, type LoginInput } from "@/lib/auth";

type LoginFormProps = {
    onSuccess: () => void;
};

export const ResetForm = ({ onSuccess }: LoginFormProps) => {
    //const [showPassword, setShowPassword] = useState(false);
    const login = useLogin({ onSuccess });
    //const [searchParams] = useSearchParams();
    //const redirectTo = searchParams.get("redirectTo");

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
            <h2 className="text-3xl font-semibold mb-8 text-grey-400">Сброс пароля</h2>
            <h4 className="mb-16 text-xl text-grey-400 text-[#4A5565]">Введите свой адрес электронной почты, и вы получите инструкцию по смене пароля</h4>

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

                    <Button
                        type="submit"
                        // className="w-full h-12 bg-[#050511] hover:bg-black text-white rounded-lg text-lg font-semibold"
                        className="w-full h-12 bg-[#030213] text-white text-lg font-semibold"
                        disabled={login.isPending}
                    >
                        {login.isPending ? "Подтвердить..." : "Подтвердить"}
                    </Button>

                    {/* <Button
                        variant="outline"
                        className="w-full h-12 border-gray-200 text-lg font-semibold"
                        asChild
                    >
                        <Link to={paths.auth.register.getHref(redirectTo)}>Регистрация</Link>
                    </Button> */}
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

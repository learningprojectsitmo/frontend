import { Link, useSearchParams } from "react-router"; //useSearchParams
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
//import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { useResetWithEmail, resetWithEmailInputSchema, type ResetWithEmailInput } from "@/lib/auth";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";

export const ResetEmailForm = () => {
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    const resetEmail = useResetWithEmail();
    const form = useForm<ResetWithEmailInput>({
        resolver: zodResolver(resetWithEmailInputSchema),
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = (values: ResetWithEmailInput) => {
        resetEmail.mutate(values);
    };

    return (
        <div className="bg-white w-full max-w-[520px] px-12 py-8 bg-white rounded-2xl ">
            <div className="flex place-content-between width-full mb-8">
                <Link
                    to={paths.auth.login.getHref(redirectTo)}
                    className="w-9 h-9 flex items-center"
                >
                    <Icon name="arrow-left" width={20} height={20} />
                </Link>
                <Icon name="logo-edu-flow" width={120} height={32} alt="EduFlow Logo" />
                <div className="w-9 h-9"></div>
            </div>
            <h2 className="text-heading-3 font-semibold mb-8 text-grey-400 font-sans">
                Сброс пароля
            </h2>
            <h4 className="mb-8 text-body font-medium font-sans text-[#4A5565]">
                Введите свой адрес электронной почты, и вы получите инструкцию по смене пароля
            </h4>

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
                        disabled={resetEmail.isPending || resetEmail.isSuccess}
                    >
                        {resetEmail.isPending ? "Подтвердить..." : "Подтвердить"}
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

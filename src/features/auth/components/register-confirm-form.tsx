import { Link, useSearchParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

import { OTPFieldDemo } from "@/components/ui/pin-code/pin-code";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form/form";

import { useRegister, useResendCode } from "@/lib/auth";
import { ResendCodeTimer } from "@/components/ui/resend-code-timer/resend-code-timer";
import { Icon } from "@/components/ui/icons";
import { paths } from "@/config/paths";

const RegisterConfirmFormSchema = z.object({
    code: z.string().min(6, "Код должен состоять из 6 цифр"),
});

type RegisterConfirmFormInput = z.infer<typeof RegisterConfirmFormSchema>;

export const RegisterConfirmForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const register = useRegister({ onSuccess });
    const [searchParams] = useSearchParams();
    const redirectTo = searchParams.get("redirectTo");

    const resendCode = useResendCode();
    const sessionData = JSON.parse(sessionStorage.getItem("register") || "{}");
    const email = sessionData.email;

    const form = useForm<RegisterConfirmFormInput>({
        resolver: zodResolver(RegisterConfirmFormSchema),
        defaultValues: {
            code: "",
        },
    });

    const onSubmit = (values: RegisterConfirmFormInput) => {
        register.mutate({
            email: email,
            confirmationCode: values.code,
        });
    };

    const handleResendCode = () => {
        resendCode.mutate({
            email: email,
        });
    };

    return (
        <div className="bg-white w-full max-w-[520px] px-12 py-8 bg-white rounded-2xl ">
            <div className="flex place-content-between width-full mb-8">
                <Link
                    to={paths.auth.createAcc.getHref(redirectTo)}
                    className="w-9 h-9 flex items-center"
                >
                    <Icon name="arrow-left" width={20} height={20} />
                </Link>
                <Icon name="logo-edu-flow" width={120} height={32} alt="EduFlow Logo" />
                <div className="w-9 h-9"></div>
            </div>
            <h2 className="text-heading-3 font-semibold mb-8 text-grey-400 font-sans">
                Введите код из письма
            </h2>
            <h4 className="mb-12 text-grey-400 text-[#4A5565] font-medium font-sans text-body">
                На указанную почту был выслан 6-значный код
            </h4>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="code"
                        render={({ field, fieldState }) => (
                            <FormItem>
                                <FormControl>
                                    <OTPFieldDemo
                                        value={field.value}
                                        onValueChange={field.onChange}
                                        error={!!fieldState.error}
                                    />
                                </FormControl>
                                <div className="flex flex-row items-center">
                                    {fieldState.error ? (
                                        <AlertCircle
                                            size={12}
                                            className={cn(
                                                "shrink-0",
                                                !fieldState.error
                                                    ? "text-[--error-disabled-text]"
                                                    : "text-[--error-text]",
                                            )}
                                        />
                                    ) : null}

                                    <FormMessage className="text-red-500" />
                                </div>
                            </FormItem>
                        )}
                    />

                    <ResendCodeTimer
                        onResend={handleResendCode}
                        initialSeconds={60}
                        disabled={register.isPending}
                    />

                    <Button
                        type="submit"
                        // className="w-full h-12 bg-[#050511] hover:bg-black text-white rounded-lg text-lg font-semibold"
                        className="w-full h-12 bg-[#030213] text-white"
                        disabled={register.isPending || resendCode.isPending}
                    >
                        {register.isPending ? "Подтвердить..." : "Подтвердить"}
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

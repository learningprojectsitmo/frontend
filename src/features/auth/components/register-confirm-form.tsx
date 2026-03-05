import { Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { OTPFieldDemo } from "@/components/ui/pin-code/pin-code";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form/form";

import { useRegister, useResendCode } from "@/lib/auth";
import { ResendCodeTimer } from "@/components/ui/resend-code-timer/resend-code-timer";

const RegisterConfirmFormSchema = z.object({
    code: z.string().min(6, "Код должен состоять из 6 цифр"),
});

type RegisterConfirmFormInput = z.infer<typeof RegisterConfirmFormSchema>;

export const RegisterConfirmForm = ({ onSuccess }: { onSuccess: () => void }) => {
    const register = useRegister({ onSuccess });

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
        <div className="bg-white w-full max-w-[560px] px-12 py-8 bg-white rounded-2xl ">
            <h1 className="text-heading-4 font-sans font-semibold text-center text-blue-600 mb-8">
                EduSpace
            </h1>
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
                                <FormMessage className="text-red-500 mt-1 ml-5" />
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

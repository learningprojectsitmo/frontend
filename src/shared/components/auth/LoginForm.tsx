import { Box, Button, TextField, FormHelperText } from "@mui/material";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useLogin } from "../../hooks/auth/useLogin";

type LoginFormValues = {
    email: string;
    password: string;
};

const LoginForm = ({ setRegistration }: { setRegistration: (v: boolean) => void }) => {
    const [authError, setAuthError] = useState<string | null>(null);
    const { mutate: login } = useLogin(setAuthError);

    const {
        register,
        handleSubmit,
        formState: { errors, isValid, isSubmitting },
    } = useForm<LoginFormValues>({
        mode: "onChange",
    });

    const onSubmit = async (data: LoginFormValues) => {
        await login(data);
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
            <TextField
                label="Email"
                error={Boolean(errors.email)}
                helperText={errors.email?.message}
                {...register("email", {
                    required: "Это поле обязательно",
                    pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Некорректный email",
                    },
                })}
            />

            <TextField
                label="Пароль"
                type="password"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register("password", {
                    required: "Пароль обязателен",
                    minLength: {
                        value: 8,
                        message: "Минимум 8 символов",
                    },
                    validate: (value) =>
                        (/[A-Z]/.test(value) &&
                            /[a-z]/.test(value) &&
                            /[^A-Za-z0-9]/.test(value)) ||
                        "Пароль должен содержать спецсимволы и буквы в разном регистре",
                })}
            />

            {authError && (
                <FormHelperText error sx={{ fontSize: 14 }}>
                    {authError}
                </FormHelperText>
            )}

            <Button variant="contained" type="submit" disabled={!isValid || isSubmitting}>
                Войти
            </Button>

            <Button variant="outlined" onClick={() => setRegistration(true)}>
                Регистрация
            </Button>
        </Box>
    );
};

export default LoginForm;

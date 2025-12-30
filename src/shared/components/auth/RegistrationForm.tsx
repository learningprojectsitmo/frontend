import { useState } from "react";
import { Box, Button, TextField, FormHelperText } from "@mui/material";
import type { RegistrationFormProps } from "../../types/props/LoginPageProps";
import "./Form.css";
import { useRegistration } from "../../hooks/auth/useRegistration";
import { useForm } from "react-hook-form";
import type { RegistrationBodyForRequest, RegistrationFormType } from "../../types/forms/RegistrationFormType";

const RegistrationForm = ({ setRegistration, onRegistrationSuccess }: RegistrationFormProps) => {
    const [authError, setAuthError] = useState<string | null>(null);

    const { mutate: registration } = useRegistration(setAuthError, onRegistrationSuccess);

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors, isValid, isSubmitting },
    } = useForm<RegistrationFormType>({
        mode: "onChange",
    });

    const password = watch("password");

    const onSubmit = async (data: RegistrationFormType) => {
        const body = {
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName ? data.lastName : "",
            email: data.email,
            isuNumber: data.isuNumber ? data.isuNumber : "",
            password: data.password
        } as RegistrationBodyForRequest

        await registration(body);
    };

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate className="login-form">
            <TextField
                id="registration-firstName"
                label="Имя"
                {...register("firstName", {
                    required: "Это поле обязательно",
                    minLength: { value: 1, message: "Минимум 1 символ" },
                })}
            />
            <TextField
                id="registration-middleName"
                label="Фамилия"
                {...register("middleName", {
                    required: "Это поле обязательно",
                    minLength: { value: 1, message: "Минимум 1 символ" },
                })}
            />
            <TextField
                id="registration-lastName"
                label="Отчество"
                {...register("lastName", {
                    required: false,
                    minLength: { value: 1, message: "Минимум 1 символ" },
                })}
            />
            <TextField
                id="registration-ISU"
                label="Номер ИСУ"
                error={Boolean(errors.isuNumber)}
                helperText={errors.isuNumber?.message}
                {...register("isuNumber", {
                    required: false,
                    pattern: {
                        value: /^\d{6}$/,
                        message: "Номер ису состоит ровно из 6 цифр",
                    },
                })}
            />
            <TextField
                id="registration-email"
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
                id="registration-password"
                label="Пароль"
                error={Boolean(errors.password)}
                helperText={errors.password?.message}
                {...register("password", {
                    required: "Это поле обязательно",
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
                type="password"
            />
            <TextField
                id="registration-secondPassword"
                label="Подтвердите пароль"
                error={Boolean(errors.secondPassword)}
                helperText={errors.secondPassword?.message}
                {...register("secondPassword", {
                    required: "Пароли не совпадают",
                    validate: (value) => value === password || "Пароли не совпадают",
                })}
                type="password"
            />
            {authError && (
                <FormHelperText error sx={{ fontSize: 14 }}>
                    {authError}
                </FormHelperText>
            )}
            <Button variant="contained" disabled={!isValid || isSubmitting} type="submit">
                Регистрация
            </Button>
            <Button variant="outlined" onClick={() => setRegistration(false)}>
                Назад
            </Button>
        </Box>
    );
};

export default RegistrationForm;

<<<<<<< HEAD
import type { FC } from "react";
import React, { useState, useContext } from "react";
import { Link, useNavigate } from "react-router";
import { Context } from "../../../app/main";
import { observer } from "mobx-react-lite";
import { Box, Button, TextField } from "@mui/material";
import "./CreateUserForm.css";

const CreateUserForm: FC = () => {
    const navigate = useNavigate();
    const { store } = useContext(Context);

    const [firstName, setFirstName] = useState<string>("");
    const [firstNameError, setFirstNameError] = useState<string>("");

    const [middleName, setMiddleName] = useState<string>("");
    const [middleNameError, setMiddleNameError] = useState<string>("");

    const [lastName, setLastName] = useState<string>("");

    const [ISU, setISU] = useState<number>();
    const [ISUError, setISUError] = useState<string>("");

    const [email, setEmail] = useState<string>("");
    const [emailError, setEmailError] = useState<string>("");

    const [password, setPassword] = useState<string>("");
    const [passwordError, setPasswordError] = useState<string>("");

    const [secondPassword, setSecondPassword] = useState<string>("");
    const [secondPasswordError, setSecondPasswordError] = useState<string>("");

    const [formSent, setFormSent] = useState<boolean>(false);
    const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setFormSent(true);
        e.preventDefault();
        if (
            ISUError ||
            emailError ||
            firstNameError ||
            middleNameError ||
            passwordError ||
            !email ||
            !password ||
            !firstName ||
            !middleName
        ) {
=======
import type { FC } from 'react'
import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router'
import { Context } from '../../../app/main'
import { observer } from 'mobx-react-lite'
import { Box, Button, TextField } from '@mui/material';
import './CreateUserForm.css';

const CreateUserForm: FC = () => {
    const navigate = useNavigate();
    const { store } = useContext(Context)

    const [firstName, setFirstName] = useState<string>('')
    const [firstNameError, setFirstNameError] = useState<string>('')

    const [middleName, setMiddleName] = useState<string>('')
    const [middleNameError, setMiddleNameError] = useState<string>('')

    const [lastName, setLastName] = useState<string>('')

    const [ISU, setISU] = useState<number>()
    const [ISUError, setISUError] = useState<string>('')

    const [email, setEmail] = useState<string>('')
    const [emailError, setEmailError] = useState<string>('')

    const [password, setPassword] = useState<string>('')
    const [passwordError, setPasswordError] = useState<string>('')

    const [secondPassword, setSecondPassword] = useState<string>('')
    const [secondPasswordError, setSecondPasswordError] = useState<string>('')

    const [formSent, setFormSent] = useState<boolean>(false)
    const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setFormSent(true)
        e.preventDefault();
        if (ISUError || emailError || firstNameError || middleNameError || passwordError || !email || !password || !firstName || !middleName) {
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
            alert("Неправильный ввод, пожалуйста проверьте корректность введенных данных");
        } else if (password !== secondPassword) {
            alert("Пароли не совпадают, пожалуйста проверьте корректность введенных данных");
        } else {
<<<<<<< HEAD
            await store.registration(firstName, middleName, lastName, email, password);
            // После успешной регистрации показываем сообщение и перенаправляем на логин
            setRegistrationSuccess(true);
            setTimeout(() => {
                navigate("/"); // Перенаправляем на главную страницу (которая покажет LoginPage)
            }, 2000);
        }
        setFormSent(false);
    };

=======
            await store.registration(firstName, middleName, lastName, email, password)
            // После успешной регистрации показываем сообщение и перенаправляем на логин
            setRegistrationSuccess(true);
            setTimeout(() => {
                navigate('/'); // Перенаправляем на главную страницу (которая покажет LoginPage)
            }, 2000);
        }
        setFormSent(false)
    };


>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
    const handleFirstNameChange = (value: string) => {
        setFirstName(value);
        if (value.length < 1) {
            setFirstNameError("Это поле обязательно к заполнению");
        } else {
<<<<<<< HEAD
            setFirstNameError("");
=======
            setFirstNameError('');
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
        }
    };

    const handleMiddleNameChange = (value: string) => {
        setMiddleName(value);
        if (value.length < 1) {
            setMiddleNameError("Это поле обязательно к заполнению");
        } else {
<<<<<<< HEAD
            setMiddleNameError("");
=======
            setMiddleNameError('');
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
        }
    };

    const handleEmailChange = (value: string) => {
        setEmail(value);
        if (!/^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$/.test(value)) {
            setEmailError("Неправильный формат почты");
        } else {
<<<<<<< HEAD
            setEmailError("");
=======
            setEmailError('');
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
        }
    };
    const handleISUChange = (value: string) => {
        setISU(Number(value));
        if ((0 < value.length && value.length !== 6) || !/^\d*$/.test(value)) {
            setISUError("Неправильный формат ИСУ");
        } else {
<<<<<<< HEAD
            setISUError("");
=======
            setISUError('');
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
        }
    };
    const handlePasswordChange = (value: string) => {
        setPassword(value);
        // eslint-disable-next-line no-useless-escape
<<<<<<< HEAD
        if (
            !/^(?=.*[0-9])(?=.*[~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9~!?@#$%^&*_\-+\\(\)\[\]\{\}><\/\\|"'. ,]{8,64}$/.test(
                value,
            )
        ) {
            setPasswordError(
                "Пароль должен быть не менее 8 символов, включая символы в нижнем и верхнем регистрах, цифры и специальные символы",
            );
        } else {
            setPasswordError("");
=======
        if (!/^(?=.*[0-9])(?=.*[~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9~!?@#$%^&*_\-+\\(\)\[\]\{\}><\/\\|"'. ,]{8,64}$/.test(value)) {
            setPasswordError("Пароль должен быть не менее 8 символов, включая символы в нижнем и верхнем регистрах, цифры и специальные символы");
        } else {
            setPasswordError('');
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
        }
    };
    const handleSecondPasswordChange = (value: string) => {
        setSecondPassword(value);
        // eslint-disable-next-line no-useless-escape
<<<<<<< HEAD
        if (
            !/^(?=.*[0-9])(?=.*[~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,]{8,64}$/.test(
                value,
            )
        ) {
            setSecondPasswordError(
                "Пароль должен быть не менее 8 символов, включая символы в нижнем и верхнем регистрах, цифры и специальные символы",
            );
        } else {
            setSecondPasswordError("");
=======
        if (!/^(?=.*[0-9])(?=.*[~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,]{8,64}$/.test(value)) {
            setSecondPasswordError("Пароль должен быть не менее 8 символов, включая символы в нижнем и верхнем регистрах, цифры и специальные символы");
        } else {
            setSecondPasswordError('');
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
        }
    };

    // Если регистрация прошла успешно, показываем сообщение
    if (registrationSuccess) {
        return (
            <Box className="login-form-create">
                <div className="success-message">
                    <h3>Пользователь успешно создан!</h3>
                    <p>Вы будете перенаправлены на страницу входа через 2 секунды...</p>
                    <Link to="/" className="link-underline">
                        <Button variant="outlined">Перейти ко входу сейчас</Button>
                    </Link>
                </div>
            </Box>
        );
    }

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate className="login-form-create">
            <TextField
                error={Boolean(firstNameError)}
                required
                id="outlined-helperText"
                label="Имя"
<<<<<<< HEAD
                onChange={(e) => handleFirstNameChange(e.target.value)}
=======
                onChange={e => handleFirstNameChange(e.target.value)}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
                value={firstName}
                helperText={firstNameError}
            />
            <TextField
                error={Boolean(middleNameError)}
                required
                id="outlined-helperText"
                label="Фамилия"
<<<<<<< HEAD
                onChange={(e) => handleMiddleNameChange(e.target.value)}
=======
                onChange={e => handleMiddleNameChange(e.target.value)}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
                value={middleName}
                helperText={middleNameError}
            />
            <TextField
                id="outlined-helperText"
                label="Отчество"
<<<<<<< HEAD
                onChange={(e) => setLastName(e.target.value)}
=======
                onChange={e => setLastName(e.target.value)}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
                value={lastName}
            />
            <TextField
                error={Boolean(ISUError)}
                id="outlined-helperText"
                label="Номер ИСУ"
<<<<<<< HEAD
                onChange={(e) => handleISUChange(e.target.value)}
=======
                onChange={e => handleISUChange(e.target.value)}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
                value={ISU}
                helperText={ISUError ? ISUError : "Если является студентом ИТМО"}
            />
            <TextField
                error={Boolean(emailError)}
                required
                id="outlined-helperText"
                label="Email"
<<<<<<< HEAD
                onChange={(e) => handleEmailChange(e.target.value)}
=======
                onChange={e => handleEmailChange(e.target.value)}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
                value={email}
                helperText={emailError}
            />
            <TextField
                error={Boolean(passwordError)}
                required
                id="outlined-helperText"
                label="Пароль"
<<<<<<< HEAD
                onChange={(e) => handlePasswordChange(e.target.value)}
=======
                onChange={e => handlePasswordChange(e.target.value)}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
                value={password}
                type="password"
                helperText={passwordError}
            />
            <TextField
                error={Boolean(secondPasswordError)}
                required
                id="outlined-helperText"
                label="Подтвердите пароль"
<<<<<<< HEAD
                onChange={(e) => handleSecondPasswordChange(e.target.value)}
=======
                onChange={e => handleSecondPasswordChange(e.target.value)}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
                value={secondPassword}
                type="password"
                helperText={secondPasswordError}
            />
<<<<<<< HEAD
            <Button variant="contained" disabled={formSent} type="submit">
                Создать пользователя
            </Button>
            <Link to="/personas" className="exit-button link-underline">
                <Button variant="outlined" disabled={formSent}>
                    Назад
                </Button>
            </Link>
        </Box>
    );
};

export default observer(CreateUserForm);
=======
            <Button variant="contained" disabled={formSent} type="submit">Создать пользователя</Button>
            <Link to="/personas" className="exit-button link-underline">
                <Button variant="outlined" disabled={formSent}>Назад</Button>
            </Link>

        </Box>
    )
};

export default observer(CreateUserForm);
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb

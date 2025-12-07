import type { FC } from 'react'
import React, { useState, useContext } from 'react'
import { Context } from "../../main"
import { observer } from 'mobx-react-lite'
import { Box, Button, TextField, FormHelperText } from '@mui/material';
import type { LoginFormProps } from '../../models/LoginPageProps';
import './Form.css';

const RegistrationForm: FC<LoginFormProps> = ({setRegistration}) => {

    const [firstName, setFirstName ] = useState<string>('')
    const [firstNameError, setFirstNameError] = useState<string>('')

    const [middleName, setMiddleName ] = useState<string>('')
    const [middleNameError, setMiddleNameError] = useState<string>('')

    const [lastName, setLastName ] = useState<string>('')

    const [isu, setIsu ] = useState<string>('')
    const [isuError, setIsuError ] = useState<string>('')

    const [email, setEmail ] = useState<string>('')
    const [emailError, setEmailError ] = useState<string>('')

    const [password, setPassword ] = useState<string>('')
    const [passwordError, setPasswordError ] = useState<string>('')

    const [secondPassword, setSecondPassword ] = useState<string>('')
    const [secondPasswordError, setSecondPasswordError ] = useState<string>('')
   
    const {store} = useContext(Context)

    const [formSent, setFormSent ] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            setFormSent(true)
            e.preventDefault();
            if (isuError || emailError || firstNameError || middleNameError || passwordError || !email || !password || !firstName || !middleName) {
                alert("Неправильный ввод, пожалуйста проверьте корректность введенных данных");
            } else if (password !== secondPassword) {
                alert("Пароли не совпадают, пожалуйста проверьте корректность введенных данных");
            } else {
                 const isuNumber = isu ? parseInt(isu) : undefined
                 await store.registration(firstName, middleName, lastName, email, password, isuNumber)
            }
            setFormSent(false)
        };


    const handleFirstNameChange = (value: string) => {
            setFirstName(value);
            if (value.length < 1) {
                setFirstNameError("Это поле обязательно к заполнению");
            } else {
                setFirstNameError('');
            }
        };

    const handleMiddleNameChange = (value: string) => {
            setMiddleName(value);
            if (value.length < 1) {
                setMiddleNameError("Это поле обязательно к заполнению");
            } else {
                setMiddleNameError('');
            }
        };

    const handleEmailChange = (value: string) => {
            setEmail(value);
            if (!/^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$/.test(value)) {
                setEmailError("Неправильный формат почты");
            } else {
                setEmailError('');
            }
        };
    const handleIsuChange = (value: string) => {
            setIsu(value);
            if (value && (value.length !== 6 || !/^\d{6}$/.test(value))) {
                setIsuError("Неправильный формат ИСУ (должно быть 6 цифр)");
            } else {
                setIsuError('');
            }
        };
    const handlePasswordChange = (value: string) => {
            setPassword(value);
            if (!/^(?=.*[0-9])(?=.*[~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,]{8,64}$/.test(value)) {
                setPasswordError("Пароль должен быть не менее 8 символов, включая символы в нижнем и верхнем регистрах, цифры и специальные символы");
            } else {
                setPasswordError('');
            }
        };
    const handleSecondPasswordChange = (value: string) => {
            setSecondPassword(value);
            if (!/^(?=.*[0-9])(?=.*[~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,]{8,64}$/.test(value)) {
                setSecondPasswordError("Пароль должен быть не менее 8 символов, включая символы в нижнем и верхнем регистрах, цифры и специальные символы");
            } else {
                setSecondPasswordError('');
            }
        };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
            <TextField
                error={Boolean(firstNameError)}
                required
                id="registration-firstName"
                label="Имя"
                onChange={e => handleFirstNameChange(e.target.value)}
                value={firstName}
                helperText={firstNameError}
            />
            <TextField
                error={Boolean(middleNameError)}
                required
                id="registration-middleName"
                label="Фамилия"
                onChange={e => handleMiddleNameChange(e.target.value)}
                value={middleName}
                helperText={middleNameError}
            />
            <TextField
                id="registration-lastName"
                label="Отчество"
                onChange={e => setLastName(e.target.value)}
                value={lastName}
            />
            <TextField
                error={Boolean(isuError)}
                id="registration-ISU"
                label="Номер ИСУ"
                onChange={e => handleIsuChange(e.target.value)}
                value={isu}
                helperText={isuError ? isuError : "Если вы являетесь студентом ИТМО"}
            />
            <TextField
                error={Boolean(emailError)}
                required
                id="registration-email"
                label="Email"
                onChange={e => handleEmailChange(e.target.value)}
                value={email}
                helperText={emailError}
            />
            <TextField
                error={Boolean(passwordError)} 
                required
                id="registration-password"
                label="Пароль"
                onChange={e => handlePasswordChange(e.target.value)}
                value={password}
                type="password"
                helperText={passwordError}
            />
            <TextField
                error={Boolean(secondPasswordError)} 
                required
                id="registration-secondPassword"
                label="Подтвердите пароль"
                onChange={e => handleSecondPasswordChange(e.target.value)}
                value={secondPassword}
                type="password"
                helperText={secondPasswordError}
            />
            <FormHelperText sx={{ typography: { fontSize: 14 }, color: 'red' }}>{store.isRegistrationFailed ? 'Неверный логин/пароль' : ''}</FormHelperText>
            <Button variant="contained" disabled={formSent} type="submit">Регистрация</Button>
            <Button variant="outlined" disabled={formSent} onClick={() => setRegistration(false)}>Назад</Button>
        </Box>
    )
};

export default observer(RegistrationForm);
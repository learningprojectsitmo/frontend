import type { FC } from 'react'
import React, { useState, useContext } from 'react'
import { Link } from 'react-router'
import { Context } from "../../main"
import { observer } from 'mobx-react-lite'
import { Box, Button, TextField } from '@mui/material';
import './CreateUserForm.css';

const CreateUserForm: FC = () => {

    const [firstName, setFirstName ] = useState<string>('')
    const [firstNameError, setFirstNameError] = useState<string>('')

    const [middleName, setMiddleName ] = useState<string>('')
    const [middleNameError, setMiddleNameError] = useState<string>('')

    const [lastName, setLastName ] = useState<string>('')

    const [ISU, setISU ] = useState<number>()
    const [ISUError, setISUError ] = useState<string>('')

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
            if (ISUError || emailError || firstNameError || middleNameError || passwordError || !email || !password || !firstName || !middleName) {
                alert("Неправильный ввод, пожалуйста проверьте корректность введенных данных");
            } else if (password !== secondPassword) {
                alert("Пароли не совпадают, пожалуйста проверьте корректность введенных данных");
            } else {
                 await store.registration(firstName, middleName, lastName, ISU, email, password)
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
    const handleISUChange = (value: string) => {
            setISU(Number(value));
            if ((0 < value.length && value.length !== 6) || !/^\d*$/.test(value)) {
                setISUError("Неправильный формат ИСУ");
            } else {
                setISUError('');
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
        <Box component="form" onSubmit={handleSubmit} noValidate className="login-form-create">
            <TextField
                error={Boolean(firstNameError)}
                required
                id="outlined-helperText"
                label="Имя"
                onChange={e => handleFirstNameChange(e.target.value)}
                value={firstName}
                helperText={firstNameError}
            />
            <TextField
                error={Boolean(middleNameError)}
                required
                id="outlined-helperText"
                label="Фамилия"
                onChange={e => handleMiddleNameChange(e.target.value)}
                value={middleName}
                helperText={middleNameError}
            />
            <TextField
                id="outlined-helperText"
                label="Отчество"
                onChange={e => setLastName(e.target.value)}
                value={lastName}
            />
            <TextField
                error={Boolean(ISUError)}
                id="outlined-helperText"
                label="Номер ИСУ"
                onChange={e => handleISUChange(e.target.value)}
                value={ISU}
                helperText={ISUError ? ISUError : "Если является студентом ИТМО"}
            />
            <TextField
                error={Boolean(emailError)}
                required
                id="outlined-helperText"
                label="Email"
                onChange={e => handleEmailChange(e.target.value)}
                value={email}
                helperText={emailError}
            />
            <TextField
                error={Boolean(passwordError)} 
                required
                id="outlined-helperText"
                label="Пароль"
                onChange={e => handlePasswordChange(e.target.value)}
                value={password}
                type="password"
                helperText={passwordError}
            />
            <TextField
                error={Boolean(secondPasswordError)} 
                required
                id="outlined-helperText"
                label="Подтвердите пароль"
                onChange={e => handleSecondPasswordChange(e.target.value)}
                value={secondPassword}
                type="password"
                helperText={secondPasswordError}
            />
            <Button variant="contained" disabled={formSent} type="submit">Создать пользователя</Button>
            <Link to="/personas" className="exit-button link-underline">
                <Button variant="outlined" disabled={formSent}>Назад</Button>
            </Link>
            
        </Box>
    )
};

export default observer(CreateUserForm);
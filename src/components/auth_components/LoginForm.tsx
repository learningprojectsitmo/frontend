import type { FC } from 'react'
import { useState, useContext } from 'react'
import { Context } from "../../main"
import { observer } from 'mobx-react-lite'
import { Box, Button, TextField, FormHelperText } from '@mui/material';
import type { LoginFormProps } from '../../models/LoginPageProps';
import './Form.css';

const LoginForm: FC<LoginFormProps> = ({setRegistration}) => {
    const [email, setEmail ] = useState<string>('')
    const [emailError, setEmailError ] = useState<string>('')

    const [password, setPassword ] = useState<string>('')
    const [passwordError, setPasswordError ] = useState<string>('')

    const {store} = useContext(Context)

    const [formSent, setformSent ] = useState<boolean>(false)

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
            setformSent(true);
            e.preventDefault();
            if (emailError || passwordError || !email || !password) {
                alert("Неправильный ввод, пожалуйста проверьте корректность введенных данных");
            } else {
                await store.login(email, password)
            }
            setformSent(false);
        };

    const handleEmailChange = (value: string) => {
            setEmail(value);
            if (!/^[a-zA-Z0-9._:$!%-]+@[a-zA-Z0-9.-]+.[a-zA-Z]$/.test(value)) {
                setEmailError("Неправильный формат почты");
            } else {
                setEmailError('');
            }
        };
    
    const handlePasswordChange = (value: string) => {
            setPassword(value);
            if (!/^(?=.*[0-9])(?=.*[~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,])(?=.*[A-Z])(?=.*[a-z])[A-Za-z0-9~!?@#$%^&*_\-+\(\)\[\]\{\}><\/\\|"'. ,]{8,64}$/.test(value)) {
                setPasswordError("Пароль должен быть длиной от 8 до 64 символов, включая символы в нижнем и верхнем регистрах, цифры и специальные символы");
            } else {
                setPasswordError('');
            }
        };

    return (
        <Box component="form" onSubmit={handleSubmit} noValidate className="login-form">
            <TextField
                error={Boolean(emailError)}
                required
                id="login-email"
                label="Email"
                onChange={e => handleEmailChange(e.target.value)}
                value={email}
                helperText={emailError}
            />
            <TextField
                error={Boolean(passwordError)} 
                required
                id="login-password"
                label="Пароль"
                onChange={e => handlePasswordChange(e.target.value)}
                value={password}
                type="password"
                helperText={passwordError}
            />
            <FormHelperText sx={{ typography: { fontSize: 14 }, color: 'red' }}>{store.isLoginFailed ? 'Неверный логин/пароль' : ''}</FormHelperText>
            <Button variant="contained" disabled={formSent} type="submit">Войти</Button>
            <Button variant="outlined" disabled={formSent} onClick={() => setRegistration(true)}>Регистрация</Button>
        </Box>
    )
};

export default observer(LoginForm);
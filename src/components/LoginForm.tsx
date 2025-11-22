import type { FC } from 'react'
import './LoginForm.css';
import { useState, useContext } from 'react'
import { Context } from "../main"
import { observer } from 'mobx-react-lite'
import { Button, TextField } from '@mui/material';

const LoginForm: FC = () => {
    const [email, setEmail ] = useState<string>('')
    const [password, setPassword ] = useState<string>('')
    const {store} = useContext(Context)

    return (
        <div className="wrapper">
            <div className="icon-div">
                <img className="icon" src="../../public/itmo_logo.png"/>
            </div>
            <div className="login-form-wrapper">
                <div className="login-form">
                    <TextField
                        id="outlined-helperText"
                        label="Email"
                        onChange={e => setEmail(e.target.value)}
                        value={email}
                    />
                    <TextField
                        id="outlined-helperText"
                        label="Password"
                        onChange={e => setPassword(e.target.value)}
                        value={password}
                        type="password" 
                    />
                    <Button variant="contained" onClick={() => store.login(email, password)}>Войти</Button>
                    <Button variant="outlined" onClick={() => store.registration(email, password)}>Регистрация</Button>
                </div>
                
            </div>
        </div>
    )
};

export default observer(LoginForm);
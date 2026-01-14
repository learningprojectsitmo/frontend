<<<<<<< HEAD
import LoginForm from "../../../shared/components/auth/LoginForm.tsx";
import RegistrationForm from "../../../shared/components/auth/RegistrationForm.tsx";
import "./LoginPage.css";
import { useState } from "react";

export function LoginPage() {
    const [registration, setRegistration] = useState<boolean>(false);

    // Функция для переключения на форму логина после успешной регистрации
    const handleRegistrationSuccess = () => {
        setRegistration(false);
        // Опционально: показать уведомление об успешной регистрации
        alert("Регистрация успешна! Теперь вы можете войти в систему.");
    };

    return (
        <div className="wrapper">
            <div className="icon-div">
                <img className="icon" src="../../itmo_logo.png" />
            </div>

            <div className="login-form-wrapper">
                {registration ? (
                    <RegistrationForm
                        setRegistration={setRegistration}
                        onRegistrationSuccess={handleRegistrationSuccess}
                    />
                ) : (
                    <LoginForm setRegistration={setRegistration} />
                )}
            </div>
        </div>
    );
}
=======
import LoginForm from '../../../shared/components/auth/LoginForm.tsx';
import RegistrationForm from '../../../shared/components/auth/RegistrationForm.tsx';
import './LoginPage.css';
import { useState } from 'react'

export function LoginPage() {
  const [registration, setRegistration] = useState<boolean>(false)

  // Функция для переключения на форму логина после успешной регистрации
  const handleRegistrationSuccess = () => {
    setRegistration(false);
    // Опционально: показать уведомление об успешной регистрации
    alert('Регистрация успешна! Теперь вы можете войти в систему.');
  }

  return (
    <div className="wrapper">
      <div className="icon-div">
        <img className="icon" src="../../itmo_logo.png"/>
      </div>
      
      <div className="login-form-wrapper">
          {registration ? 
            <RegistrationForm 
              setRegistration={setRegistration} 
              onRegistrationSuccess={handleRegistrationSuccess}
            /> : 
            <LoginForm setRegistration={setRegistration} />
          }
      </div>
    </div>
  );
}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb

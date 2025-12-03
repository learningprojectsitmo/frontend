import LoginForm  from '../../components/auth_components/LoginForm.tsx'
import RegistrationForm from '../../components/auth_components/RegistrationForm.tsx';
import './LoginPage.css';
import { useState } from 'react'

export function LoginPage() {
  const [registration, setRegistration] = useState<boolean>(false)

  return (
    <div className="wrapper">
      <div className="icon-div">
        <img className="icon" src="../../itmo_logo.png"/>
      </div>
      
      <div className="login-form-wrapper">
          {registration ? <RegistrationForm setRegistration={setRegistration} /> : <LoginForm setRegistration={setRegistration} />}
      </div>
    </div>
  );
}
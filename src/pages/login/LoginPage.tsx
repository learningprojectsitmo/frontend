import { Link } from 'react-router';
import './LoginPage.css';

export function LoginPage() {

  return (
    <>
      <input></input>
      <input></input>
      <Link to="/homepage">
        <button>Войти</button>
      </Link>
    </>
  );
}
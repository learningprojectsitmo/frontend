import './HomePage.css';
import { useContext } from 'react';
import { Context } from '../../main';

export function HomePage() {

  const {store} =useContext(Context);

  return (
    <>
      <p>yatta!</p>
      <button onClick={() => store.logout()}>Выйти</button>
    </>
  );
}
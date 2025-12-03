import './HomePage.css';
import '../pages.css'
import { useContext } from 'react';
import { Context } from '../../main';
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'

export function HomePage() {

  const {store} =useContext(Context);

  return (
    <div className="outer-wrapper">
      <Sider navbarOption={1} />
      <div className="header-wrapper">
        <Header pageName="Главная" profileName="Иванов Иван"/>
        <div></div>
      </div>
    </div>
  );
}
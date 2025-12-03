import './PersonasPage.css';
import '../pages.css'
import { useContext } from 'react';
import { Context } from '../../main';
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'

export function PersonasPage() {

  const {store} =useContext(Context);

  return (
    <div className="outer-wrapper">
      <Sider navbarOption={2}/>
      <div className="header-wrapper">
        <Header pageName="Контакты" profileName="Иванов Иван"/>
        <div></div>
      </div>
    </div>
  );
}
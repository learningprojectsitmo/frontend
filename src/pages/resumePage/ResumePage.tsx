import './ResumePage.css';
import '../pages.css'
import { useContext } from 'react';
import { Context } from '../../main';
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'

export function ResumePage() {

  const {store} =useContext(Context);

  return (
    <div className="outer-wrapper">
      <Sider navbarOption={3}/>
      <div className="header-wrapper">
        <Header pageName="Резюме" profileName="Иванов Иван"/>
        <div></div>
      </div>
    </div>
  );
}
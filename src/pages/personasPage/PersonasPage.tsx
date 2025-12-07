import './PersonasPage.css';
import '../pages.css'
import { useContext } from 'react';
import { Context } from '../../main';
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'
import { Link } from 'react-router';

export function PersonasPage() {

  const {store} =useContext(Context);

  return (
    <div className="outer-wrapper">
      <Sider navbarOption={2}/>
      <div className="header-wrapper">
        <Header pageName="Контакты" profileName="Иванов Иван"/>
        <div className="content-wrapper">
          <div className="top-bar">
            <Link to="create" className="link-underline">
              <button className="create-user-button">Создать пользователя</button>
            </Link>
          </div>
          <div></div>
        </div>
      </div>
    </div>
  );
}
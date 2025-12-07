import './createUserPage.css';
import '../pages.css'
//import { useContext } from 'react';
//import { Context } from '../../main';
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'
import CreateUserForm from '../../components/auth_components/CreateUserForm'

export function CreateUserPage() {

  //const {store} =useContext(Context);

  return (
    <div className="outer-wrapper">
      <Sider navbarOption={2} />
      <div className="header-wrapper">
        <Header pageName="Создать пользователя" profileName="Иванов Иван"/>
        <div className="create-user-form-wrapper">
          <CreateUserForm />
        </div>
      </div>
    </div>
  );
}
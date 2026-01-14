<<<<<<< HEAD
import "./CreateUserPage.css";
import "../pages.css";
import CreateUserForm from "../../../shared/components/auth/CreateUserForm";
import { DefaultPageScreen } from "../../../shared/components/screens/DefaultPageScreen";
//import { useContext } from 'react';
//import { Context } from '../../main';

export function CreateUserPage() {
    //const {store} =useContext(Context);

    return (
        <DefaultPageScreen
            pageName="Создать пользователя"
            profileName="Иванов Иван"
            navbarOption={2}
        >
            <div>
                <CreateUserForm />
            </div>
        </DefaultPageScreen>
    );
}
=======
import './CreateUserPage.css';
import '../pages.css'
import CreateUserForm from '../../../shared/components/auth/CreateUserForm';
import { DefaultPageScreen } from '../../../shared/components/screens/DefaultPageScreen';
//import { useContext } from 'react';
//import { Context } from '../../main';


export function CreateUserPage() {

  //const {store} =useContext(Context);

  return (
    <DefaultPageScreen pageName='Создать пользователя' profileName='Иванов Иван' navbarOption={2}>
      <div>
        <CreateUserForm />
      </div>
    </DefaultPageScreen>
  );
}
>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb

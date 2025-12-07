import './PersonasPage.css';
import '../pages.css'
import { Persona } from './Persona'
import { useContext } from 'react';
import { Context } from '../../main';
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'
import { Link } from 'react-router';


export function PersonasPage() {
  const {store} =useContext(Context);
  
  async function getPersonaBlocks() {
    const response = await store.getUsers()

    const personasBlocks = [];
    if (response) {
      for (let user of response.data) {
        personasBlocks.push(<Persona firstName={user.first_name} middleName={user.middle_name} lastName={user.last_name}/>)
      }
    }
    
    
    return personasBlocks
  }

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
          <div className="personas">
            {getPersonaBlocks()}
          </div>
        </div>
      </div>
    </div>
  );
}
import './PersonasPage.css';
import '../pages.css'
import { Persona } from './Persona'
import { useContext, useState, useEffect } from 'react';
import { Context } from '../../main';
import { Sider } from '../../components/mainPage_components/Sider';
import { Header } from '../../components/mainPage_components/Header'
import { Link } from 'react-router';
import type { IUser } from '../../models/IUser';

export function PersonasPage() {
  const {store} = useContext(Context);
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true);
        const response = await store.getUsers();
        if (response && response.data.items) {
          setUsers(response.data.items);
        }
      } catch (error) {
        console.error('Failed to load users:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUsers();
  }, []); // Пустой массив зависимостей - выполнится только при монтировании

  const getPersonaBlocks = () => {
    return users.map(user => (
      <Persona 
        key={user.id}
        user={user}
      />
    ));
  };

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
            {isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <p>Загрузка пользователей...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Пользователи не найдены</h3>
                <p>Пока что в системе нет зарегистрированных пользователей.</p>
              </div>
            ) : (
              getPersonaBlocks()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
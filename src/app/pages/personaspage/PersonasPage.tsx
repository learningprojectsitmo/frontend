import './PersonasPage.css';
import '../pages.css'
import { Persona } from './Persona';
import { useContext, useState, useEffect } from 'react';
import { Context } from '../../main';
import { Link } from 'react-router';
import type { IUser } from '../../../shared/types/entities/User';
import { DefaultPageScreen } from '../../../shared/components/screens/DefaultPageScreen';
import { PaginationBlock } from '../../../shared/components/pagination/Pagination';

export function PersonasPage() {
  const queryParams = new URLSearchParams(window.location.search)
  const searchParam = queryParams.get("search") || '' //На будущее, когда появиться возможность отправлять запрос на список пользователей удовлетворяющих значению в поисковой строке 
  const [page, setPage] = useState(Number(queryParams.get("page")) || 1)
  const {store} = useContext(Context);
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUsers() {
      try {
        setIsLoading(true);
        const response = await store.getUsers(page);
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
  }, [page]); //тригер при каждом изменении значения page

  const getPersonaBlocks = () => {
    return users.map(user => (
      <Persona 
        key={user.id}
        user={user}
      />
    ));
  };

  return (
    <DefaultPageScreen pageName='Контакты' profileName='Иванов Иван' navbarOption={2}>
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
          <PaginationBlock page={page} setPage={setPage} pageName={"personas"}/>
        </div>
    </DefaultPageScreen>
  );
}
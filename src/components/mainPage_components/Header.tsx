import './Header.css';
import { useContext } from 'react';
import { Context } from '../../main';

export function Header() {
  const { store } = useContext(Context);

  const handleLogout = () => {
    store.logout();
  };

  return (
    <div className="header-container">
      <div className="header-content">
        <div className="user-info">
          <div className="user-avatar">
            {store.user.email ? store.user.email.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-details">
            <div className="user-email">{store.user.email}</div>
            <div className="user-status">
              {store.user.isActivated ? 'Активирован' : 'Не активирован'}
            </div>
          </div>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          Выйти
        </button>
      </div>
    </div>
  );
}
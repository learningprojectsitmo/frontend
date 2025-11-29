import './Sider.css';
import { NavLink } from 'react-router';

export function Sider() {
  const menuItems = [
    { path: '/', label: 'Главная', icon: '🏠' },
    { path: '/tasks', label: 'Задачи', icon: '📋' },
    { path: '/resume', label: 'Резюме', icon: '📄' },
    { path: '/projects', label: 'Проекты', icon: '🚀' },
    { path: '/personas', label: 'Персоны', icon: '👥' },
    { path: '/kanban', label: 'Канбан', icon: '📊' },
    { path: '/applications', label: 'Заявки', icon: '📝' },
  ];

  return (
    <div className="sider-wrapper">
      <div className="sider-container">
        <img className="icon" src="../../public/itmo_logo.png" alt="ИТМО"/>
        <div className="options-wrapper">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }: { isActive: boolean }) => 
                `menu-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="menu-icon">{item.icon}</div>
              <div className="option-text">{item.label}</div>
            </NavLink>
          ))}
        </div>
      </div>
    </div>
  );
}
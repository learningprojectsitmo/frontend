import './HomePage.css';
import { BasePage } from '../../components/mainPage_components/BasePage';

export function HomePage() {
  return (
    <BasePage>
      <div className="page-content">
        <div className="page-header">
          <h1>Добро пожаловать!</h1>
          <p>Главная страница системы управления проектами</p>
        </div>
        <div className="home-container">
          <div className="welcome-card">
            <h3>🏠 Главная страница</h3>
            <p>Добро пожаловать в систему управления проектами и задачами!</p>
            <div className="stats">
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Задач</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Проектов</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">0</span>
                <span className="stat-label">Заявок</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BasePage>
  );
}